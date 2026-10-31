<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Emergencia\AdmitToEmergency;
use App\Actions\Patients\SearchPatients;
use App\Http\Controllers\Controller;
use App\Http\Requests\AdmitToEmergencyRequest;
use App\Http\Requests\EmergencyApplicationRequest;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\Patient;
use App\Models\Setting;
use App\Models\User;
use App\Support\EmergencyPresenter;
use App\Support\Toast;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmergenciaController extends Controller
{
    /** Board: every patient in emergency, oldest arrival first, and the cubicles */
    public function index(EmergencyPresenter $presenter): Response
    {
        $active = Emergency::active()->with(['patient', 'doctor', 'cubicle', 'latestVital'])->orderBy('arrived_at')->get();

        return Inertia::render('emergencia/index', [
            'emergencies' => $active->map(fn (Emergency $e): array => $presenter->row($e))->values()->all(),
            'cubicles' => $presenter->cubicles($active),
        ]);
    }

    public function show(Request $request, Emergency $emergency, EmergencyPresenter $presenter): Response
    {
        /** @var User $user */
        $user = $request->user();
        $occupied = Emergency::whereNotNull('occupied_cubicle_id')->pluck('occupied_cubicle_id');

        return Inertia::render('emergencia/show', [
            'emergency' => $presenter->detail($emergency),
            'vitals' => $presenter->vitals($emergency),
            'applications' => $presenter->applications($emergency),
            'catalog' => $emergency->isActive() ? $presenter->catalog() : [],
            'routes' => EmergencyApplicationRequest::ROUTES,
            'can_discharge' => $emergency->isActive() && $user->doctor !== null,
            'free_cubicles' => EmergencyCubicle::active()->whereNotIn('id', $occupied)->get()
                ->map(fn (EmergencyCubicle $c): array => ['id' => $c->id, 'name' => $c->name])->values()->all(),
        ]);
    }

    /** Quick admission: free cubicles, doctors on duty and the fee */
    public function create(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $occupied = Emergency::whereNotNull('occupied_cubicle_id')->pluck('occupied_cubicle_id');

        return Inertia::render('emergencia/ingreso', [
            'cubicles' => EmergencyCubicle::active()->whereNotIn('id', $occupied)->get()
                ->map(fn (EmergencyCubicle $c): array => ['id' => $c->id, 'name' => $c->name])->values()->all(),
            'doctors' => Doctor::with('specialty')->where('is_active', true)->orderBy('name')->get()
                ->map(fn (Doctor $d): array => ['id' => $d->id, 'name' => $d->name, 'specialty' => $d->specialty->name])->all(),
            'default_doctor_id' => $user->doctor?->is_active ? $user->doctor->id : null,
            // A free cubicle clicked on the board comes preselected
            'selected_cubicle_id' => $request->integer('cubiculo') ?: null,
            'emergency_fee' => Setting::emergencyFee(),
            'arrived_at' => now()->format('d/m/Y · H:i'),
        ]);
    }

    public function store(AdmitToEmergencyRequest $request, AdmitToEmergency $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $patient = $request->filled('patient_id') ? Patient::findOrFail($request->integer('patient_id')) : null;

        $emergency = $action->handle(
            $patient,
            $request->newPatient(),
            $request->integer('cubicle_id'),
            $request->integer('doctor_id'),
            (string) $request->validated('reason'),
            $user,
        );

        Toast::success("{$emergency->patient->full_name} registrado en emergencia · {$emergency->cubicle->name}.");

        return redirect()->route('emergencia.show', $emergency);
    }

    /** Find a registered patient by document (or name) before admitting */
    public function searchPatients(Request $request, SearchPatients $search): JsonResponse
    {
        $inEmergency = Emergency::active()->pluck('patient_id')->all();

        return response()->json(
            $search->handle((string) $request->string('q'))
                ->map(fn (Patient $p): array => [
                    'id' => $p->id,
                    'full_name' => $p->full_name,
                    'document_number' => $p->document_number,
                    'expediente_number' => $p->expediente_number,
                    'sex' => $p->sex,
                    'age' => $p->age,
                    'allergies' => $p->allergies,
                    'in_emergency' => in_array($p->id, $inEmergency, true),
                ])
                ->values(),
        );
    }
}
