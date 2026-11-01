<?php

namespace App\Http\Controllers\Modules;

use App\Actions\CreatePatient;
use App\Actions\Lab\RegisterLabWalkIn;
use App\Actions\Registro\RegisterArrival;
use App\Actions\UpdatePatient;
use App\Exceptions\PatientHasOpenTurnException;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterArrivalRequest;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;
use App\Support\LabPresenter;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class RegistroController extends Controller
{
    /**
     * Unified registration page: search → identify or register → create turn.
     */
    public function create(?Patient $patient = null): Response
    {
        // Accept ?paciente={id} to pre-load an existing patient.
        // Non-existent IDs → 404. Soft-deleted patients → silently ignored (patient = null).
        if (request()->filled('paciente')) {
            $found = Patient::withTrashed()->find(request()->integer('paciente'));
            abort_if($found === null, 404);
            $patient = $found->trashed() ? null : $found;
        }

        $doctors = Doctor::with('specialty')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Doctor $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'specialty' => $d->specialty->name,
            ]);

        // Sanitize optional prefill params from /pacientes empty-state button.
        $prefillDocumentNumber = '';
        $prefillFirstNames = '';

        if (request()->filled('documento')) {
            $prefillDocumentNumber = mb_substr(strip_tags((string) request()->input('documento')), 0, 30);
        }

        if (request()->filled('nombre')) {
            $prefillFirstNames = mb_substr(strip_tags((string) request()->input('nombre')), 0, 100);
        }

        return Inertia::render('registro/index', [
            'doctors' => $doctors,
            'patient' => $patient ? $this->patientPayload($patient) : null,
            'prefillDocumentNumber' => $prefillDocumentNumber,
            'prefillFirstNames' => $prefillFirstNames,
            // «Orden sin consulta» from Laboratorio opens on «Solo análisis»
            'initialType' => request()->query('tipo') === 'estudios' ? 'analisis' : 'consulta',
            'labCatalog' => app(LabPresenter::class)->catalog(),
        ]);
    }

    public function store(RegisterArrivalRequest $request, RegisterArrival $registerArrival, RegisterLabWalkIn $registerLabWalkIn): RedirectResponse
    {
        $validated = $request->validated();
        $patientId = $validated['patient_id'] ?? null;

        $existingPatient = $patientId ? Patient::findOrFail($patientId) : null;

        // Patient data to create or update
        $patientData = collect($validated)
            ->except(['patient_id', 'attention_type', 'doctor_id', 'notes', 'appointment_id', 'lab_test_ids', 'external_doctor'])
            ->filter(fn ($v) => $v !== null)
            ->all();

        if ($validated['attention_type'] === 'analisis') {
            /** @var User $user */
            $user = $request->user();
            $order = $registerLabWalkIn->handle(
                $existingPatient,
                $patientData,
                array_map('intval', $validated['lab_test_ids']),
                $validated['external_doctor'] ?? null,
                $user,
            );

            Toast::success("Orden {$order->number} creada para {$order->patient->full_name}. Pasa a toma de muestra.");

            return redirect()->route($user->can('module.lab.access') ? 'lab' : 'pacientes');
        }

        $attentionData = [
            'doctor_id' => $validated['doctor_id'],
            'appointment_id' => $validated['appointment_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ];

        try {
            $turn = $registerArrival->handle($existingPatient, $patientData, $attentionData);
        } catch (PatientHasOpenTurnException $e) {
            return back()->withErrors([
                'open_turn' => $e->getMessage(),
            ])->withInput();
        }

        $name = $turn->patient->full_name;

        Toast::success("Atención creada para {$name} · Turno T-{$turn->turn_number}.");

        return redirect()->route('tablero');
    }

    /**
     * Register a new patient without creating a turn.
     * Redirects to /pacientes?paciente={id} with a success flash.
     */
    public function storePatient(StorePatientRequest $request, CreatePatient $createPatient): RedirectResponse
    {
        $patient = $createPatient->handle($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Paciente registrado.']);

        return redirect()->route('pacientes', ['paciente' => $patient->id]);
    }

    public function edit(Patient $patient): Response
    {
        return Inertia::render('registro/edit', [
            'patient' => $this->patientPayload($patient),
        ]);
    }

    public function update(UpdatePatientRequest $request, Patient $patient, UpdatePatient $action): RedirectResponse
    {
        $action->handle($patient, $request->validated());

        Toast::success('Datos del paciente actualizados.');

        return redirect()->route('pacientes');
    }

    /**
     * @return array<string, mixed>
     */
    private function patientPayload(Patient $patient): array
    {
        return array_merge($patient->toArray(), [
            'full_name' => $patient->full_name,
            'initials' => $patient->initials,
            'age' => $patient->age,
            'expediente_number' => $patient->expediente_number,
            'document_number' => $patient->document_number,
            'email' => $patient->email,
            'phone' => $patient->phone,
            'photo_url' => $patient->photo_url,
            'total_turns' => $patient->turns()->count(),
            'last_attended_at' => $patient->turns()->max('arrived_at')
                ? Carbon::parse($patient->turns()->max('arrived_at'))->format('d/m/Y')
                : null,
            'open_turns_today' => $patient->turns()
                ->with('doctor')
                ->whereDate('arrived_at', today())
                ->whereIn('status', ['espera', 'en_consulta'])
                ->get()
                ->map(fn (Turn $t) => [
                    'doctor_name' => $t->doctor->name,
                    'status' => $t->status,
                ])
                ->values()
                ->all(),
        ]);
    }
}
