<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Actions\BuildClinicalHistory;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConsultationRequest;
use App\Http\Requests\StoreDischargeRequest;
use App\Http\Requests\UpdateAntecedentRequest;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Consultation;
use App\Models\Discharge;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\ImagingOrder;
use App\Models\LabOrder;
use App\Models\Patient;
use App\Models\PatientAntecedent;
use App\Models\Prescription;
use App\Models\Turn;
use App\Models\User;
use App\Support\AdmissionPresenter;
use App\Support\ImagingPresenter;
use App\Support\LabPresenter;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ConsultaController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->canAttendPatients()) {
            return Inertia::render('consulta/index', [
                'can_attend' => false,
                'turns_en_consulta' => [],
                'turns_en_espera' => [],
            ]);
        }

        $doctorId = $user->doctor->id;

        $turnsEnConsulta = Turn::with(['patient', 'doctor.specialty'])
            ->whereDate('arrived_at', today())
            ->where('status', 'en_consulta')
            ->where('doctor_id', $doctorId)
            ->orderBy('turn_order')
            ->get()
            ->map(fn (Turn $t) => $this->formatTurn($t));

        $turnsEnEspera = Turn::with(['patient', 'doctor.specialty'])
            ->whereDate('arrived_at', today())
            ->where('status', 'espera')
            ->where('doctor_id', $doctorId)
            ->orderBy('turn_order')
            ->get()
            ->map(fn (Turn $t) => $this->formatTurn($t));

        // All turn IDs the doctor has today (en_consulta + espera)
        $allTurnIds = $turnsEnConsulta->pluck('id')
            ->merge($turnsEnEspera->pluck('id'));

        $prescriptions = Prescription::with('items')
            ->whereIn('turn_id', $allTurnIds)
            ->get()
            ->mapWithKeys(fn (Prescription $p) => [
                $p->turn_id => $this->formatPrescriptionForIndex($p),
            ]);

        $historial = [];
        $historialPatient = null;
        $charges = [];
        $chargesTotal = 0;
        $labOrders = [];
        $imagingOrders = [];

        $patientId = $request->integer('patient_id');
        if ($patientId) {
            $patient = Patient::find($patientId);
            if ($patient) {
                $historial = app(BuildClinicalHistory::class)->handle($patient, $user->doctor);
                $historialPatient = $this->formatHistorialPatient($patient);

                [$charges, $chargesTotal] = $this->loadCharges($patient, $user);

                // Today's orders and anything still in progress
                $lab = app(LabPresenter::class);
                $labOrders = LabOrder::with('items.results')
                    ->where('patient_id', $patient->id)
                    ->where(fn ($q) => $q->whereDate('ordered_at', today())->orWhereIn('status', ['ordenada', 'muestra', 'ingresado']))
                    ->latest('id')
                    ->get()
                    ->map(fn (LabOrder $o): array => $lab->withResults($o))
                    ->values()
                    ->all();

                $img = app(ImagingPresenter::class);
                $imagingOrders = ImagingOrder::with(['doctor', 'attachments', 'signer'])
                    ->where('patient_id', $patient->id)
                    ->where(fn ($q) => $q->whereDate('ordered_at', today())->orWhereIn('status', ['ordenada', 'realizado', 'borrador']))
                    ->latest('id')
                    ->get()
                    ->map(fn (ImagingOrder $o): array => $img->withReport($o))
                    ->values()
                    ->all();
            }
        }

        return Inertia::render('consulta/index', [
            'can_attend' => true,
            'lab_catalog' => fn () => app(LabPresenter::class)->catalog(),
            'imaging_catalog' => fn () => app(ImagingPresenter::class)->catalog(),
            // «Ingresar»: free beds and doctors
            'admission_options' => fn () => $user->can('module.internamiento.access') ? app(AdmissionPresenter::class)->options($user) : null,
            // «Pasar a emergencia»: the cubicles free right now
            'emergency_cubicles' => fn () => EmergencyCubicle::active()
                ->whereNotIn('id', Emergency::whereNotNull('occupied_cubicle_id')->pluck('occupied_cubicle_id'))
                ->get()
                ->map(fn (EmergencyCubicle $c): array => ['id' => $c->id, 'name' => $c->name])
                ->values()
                ->all(),
            'turns_en_consulta' => $turnsEnConsulta,
            'turns_en_espera' => $turnsEnEspera,
            'historial' => $historial,
            'historial_patient' => $historialPatient,
            'prescriptions' => $prescriptions,
            'charges' => $charges,
            'charges_total' => $chargesTotal,
            'lab_orders' => $labOrders,
            'imaging_orders' => $imagingOrders,
        ]);
    }

    public function store(StoreConsultationRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validated();

        /** @var Turn $turn */
        $turn = Turn::findOrFail($validated['turn_id']);

        // doctor_id and patient_id are always taken from the turn, never from the request
        $data = collect($validated)
            ->except(['doctor_id', 'patient_id'])
            ->merge([
                'doctor_id' => $turn->doctor_id,
                'patient_id' => $turn->patient_id,
                'created_by' => $user->id,
            ])
            ->all();

        Consultation::create($data);

        Toast::success('Consulta guardada exitosamente.');

        return redirect()
            ->to(route('consulta', ['patient_id' => $turn->patient_id]));
    }

    public function discharge(StoreDischargeRequest $request, Turn $turn): RedirectResponse
    {
        // Check if a discharge already exists for this turn (422 before 403)
        if (Discharge::where('turn_id', $turn->id)->exists()) {
            throw ValidationException::withMessages([
                'message' => 'Este turno ya tiene un alta registrada.',
            ]);
        }

        if (! $turn->isOpenToday()) {
            abort(403);
        }

        /** @var User $user */
        $user = $request->user();

        $validated = $request->validated();

        $patient = $turn->patient;

        DB::transaction(function () use ($turn, $validated, $user, $patient): void {
            Discharge::create([
                'turn_id' => $turn->id,
                'patient_id' => $turn->patient_id,
                'doctor_id' => $turn->doctor_id,
                'type' => $validated['type'],
                'destination' => $validated['destination'] ?? null,
                'reason' => $validated['reason'] ?? null,
                'discharge_diagnosis' => $validated['discharge_diagnosis'],
                'created_by' => $user->id,
            ]);

            $turn->update(['status' => 'atendido']);

            app(CloseDailyAccountIfDone::class)->handle($patient);
        });

        Toast::success('Paciente dado de alta.');

        return redirect()->to(route('consulta'));
    }

    public function updateAntecedents(UpdateAntecedentRequest $request, Patient $patient): RedirectResponse
    {
        $this->authorizePatientTurnOwnership($patient);

        PatientAntecedent::updateOrCreate(
            ['patient_id' => $patient->id],
            $request->validated(),
        );

        Toast::success('Antecedentes actualizados.');

        return back();
    }

    /**
     * Load account charges for a patient's today account, filtered by visibility rule:
     * - Admin+doctor: sees ALL charges for the account
     * - Non-admin doctor: sees only their own charges (doctor_id = user's doctor id)
     *
     * @return array{0: list<array<string, mixed>>, 1: int}
     */
    private function loadCharges(Patient $patient, User $user): array
    {
        $account = Account::where('patient_id', $patient->id)
            ->whereDate('service_date', today())
            ->where('status', 'abierta')
            ->first();

        if ($account === null) {
            return [[], 0];
        }

        $isAdminDoctor = $user->hasRole('administrador') && $user->doctor !== null;

        $query = AccountCharge::with(['doctor'])
            ->where('account_id', $account->id);

        if (! $isAdminDoctor && $user->doctor !== null) {
            $query->where('doctor_id', $user->doctor->id);
        }

        $charges = $query->orderBy('created_at')->get()->map(fn (AccountCharge $c) => [
            'id' => $c->id,
            'type' => $c->type,
            'description' => $c->description,
            'quantity' => $c->quantity,
            'unit_price' => $c->unit_price,
            'total' => $c->total,
            'doctor_fee' => $c->doctor_fee,
            'doctor_id' => $c->doctor_id,
            'doctor_name' => $c->doctor?->name,
        ])->all();

        $total = array_sum(array_column($charges, 'total'));

        return [$charges, $total];
    }

    /**
     * Abort 403 unless the authenticated user's doctor has an open turn today for the patient.
     */
    private function authorizePatientTurnOwnership(Patient $patient): void
    {
        /** @var User $user */
        $user = auth()->user();

        if ($user->doctor === null) {
            abort(403);
        }

        $hasTurn = Turn::where('doctor_id', $user->doctor->id)
            ->where('patient_id', $patient->id)
            ->whereDate('arrived_at', today())
            ->whereIn('status', ['espera', 'en_consulta'])
            ->exists();

        if (! $hasTurn) {
            abort(403);
        }
    }

    /** @return array<string, mixed> */
    private function formatHistorialPatient(Patient $patient): array
    {
        return [
            'id' => $patient->id,
            'full_name' => $patient->full_name,
            'age' => $patient->age,
            'sex' => $patient->sex,
            'allergies' => $patient->allergies,
            'antecedents' => $patient->antecedent,
        ];
    }

    /** @return array<string, mixed> */
    private function formatPrescriptionForIndex(Prescription $prescription): array
    {
        return [
            'id' => $prescription->id,
            'general_instructions' => $prescription->general_instructions,
            'prescribed_at' => $prescription->prescribed_at,
            'items' => $prescription->items->map(fn ($item) => [
                'id' => $item->id,
                'position' => $item->position,
                'medication' => $item->medication,
                'route' => $item->route,
                'dose' => $item->dose,
                'frequency' => $item->frequency,
                'duration_days' => $item->duration_days,
                'is_continuous' => $item->is_continuous,
                'quantity' => $item->quantity,
            ])->all(),
        ];
    }

    /** @return array<string, mixed> */
    private function formatTurn(Turn $turn): array
    {
        return [
            'id' => $turn->id,
            'turn_number' => $turn->turn_number,
            'turn_order' => $turn->turn_order,
            'status' => $turn->status,
            'arrived_at' => $turn->arrived_at,
            'patient' => [
                'id' => $turn->patient->id,
                'full_name' => $turn->patient->full_name,
                'age' => $turn->patient->age,
                'sex' => $turn->patient->sex,
                'allergies' => $turn->patient->allergies,
            ],
            'doctor' => [
                'id' => $turn->doctor->id,
                'full_name' => $turn->doctor->name,
                'specialty' => $turn->doctor->specialty->name,
            ],
        ];
    }
}
