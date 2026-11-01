<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Emergencia\RecordApplication;
use App\Actions\Internamiento\DischargeAdmission;
use App\Http\Controllers\Controller;
use App\Http\Requests\DischargeEmergencyRequest;
use App\Http\Requests\EmergencyApplicationRequest;
use App\Http\Requests\EmergencyVitalRequest;
use App\Models\Admission;
use App\Models\AdmissionNote;
use App\Models\EmergencyVital;
use App\Models\ImagingOrder;
use App\Models\LabOrder;
use App\Models\User;
use App\Support\AdmissionPresenter;
use App\Support\EmergencyPresenter;
use App\Support\ImagingPresenter;
use App\Support\LabPresenter;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Ficha del internado: applications, studies, vitals, notes, charges and discharge */
class AdmissionController extends Controller
{
    public function show(Request $request, Admission $admission, AdmissionPresenter $presenter, EmergencyPresenter $care, LabPresenter $lab, ImagingPresenter $img): Response
    {
        /** @var User $user */
        $user = $request->user();
        $active = $admission->isActive();
        $since = $admission->admitted_at->copy()->startOfDay();
        $until = $admission->discharged_at;
        $inStay = fn ($q) => $q->where('patient_id', $admission->patient_id)->where('ordered_at', '>=', $since)
            ->when($until !== null, fn ($w) => $w->where('ordered_at', '<=', $until));

        return Inertia::render('internamiento/show', [
            'admission' => $presenter->detail($admission),
            'applications' => $care->applications($admission),
            'vitals' => $care->vitals($admission),
            'notes' => $presenter->notes($admission),
            'charges' => $presenter->charges($admission),
            'lab_orders' => LabOrder::with('items.results')->where($inStay)->latest('id')->get()
                ->map(fn (LabOrder $o): array => $lab->withResults($o))->values()->all(),
            'imaging_orders' => ImagingOrder::with(['doctor', 'attachments', 'signer'])->where($inStay)->latest('id')->get()
                ->map(fn (ImagingOrder $o): array => $img->withReport($o))->values()->all(),
            'catalog' => $active ? $care->catalog() : [],
            'routes' => EmergencyApplicationRequest::ROUTES,
            'lab_catalog' => $active ? $lab->catalog() : [],
            'imaging_catalog' => $active ? $img->catalog() : [],
            'free_beds' => $active ? $presenter->options($user)['beds'] : [],
            'can_discharge' => $active && ($user->canAttendPatients() || $user->hasAnyRole(['administrador', 'enfermeria'])),
            'shift' => AdmissionNote::shiftAt(now()),
        ]);
    }

    public function storeApplication(EmergencyApplicationRequest $request, Admission $admission, RecordApplication $record): RedirectResponse
    {
        $this->ensureActive($admission);
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $kind = (string) $data['kind'];
        $brought = $kind === 'medicamento' && $request->boolean('brought_by_patient');

        $application = DB::transaction(fn () => $record->handle(
            ['admission_id' => $admission->id],
            $admission->account_id,
            $user,
            $kind,
            $brought ? null : (int) $data['inventory_item_id'],
            $brought ? (string) $data['description'] : null,
            (int) $data['quantity'],
            $kind === 'medicamento' ? ($data['route'] ?? null) : null,
        ));

        Toast::success($brought
            ? "{$application->description} registrado (traído por el paciente, sin cargo)."
            : "{$application->description} × {$application->quantity} aplicado y cargado a la cuenta.");

        return back();
    }

    public function storeVitals(EmergencyVitalRequest $request, Admission $admission): RedirectResponse
    {
        $this->ensureActive($admission);
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        EmergencyVital::create([
            ...$data,
            'admission_id' => $admission->id,
            'temp' => (int) round(((float) $data['temp']) * 10),
            'taken_at' => now(),
            'taken_by' => $user->id,
        ]);

        Toast::success('Toma de signos vitales registrada.');

        return back();
    }

    public function storeNote(Request $request, Admission $admission): RedirectResponse
    {
        $this->ensureActive($admission);
        $body = (string) $request->validate(
            ['body' => ['required', 'string', 'max:5000']],
            ['body.required' => 'Escribe la nota.'],
        )['body'];
        /** @var User $user */
        $user = $request->user();

        $admission->notes()->create([
            'body' => trim($body),
            'shift' => AdmissionNote::shiftAt(now()),
            'created_by' => $user->id,
        ]);

        Toast::success('Nota de enfermería guardada.');

        return back();
    }

    public function discharge(DischargeEmergencyRequest $request, Admission $admission, DischargeAdmission $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var array{type: string, destination?: string|null, reason?: string|null, discharge_diagnosis: string} $data */
        $data = $request->validated();

        // The doctor who signs it; a nurse or administrator signs for the treating doctor
        $doctorId = $user->canAttendPatients() ? (int) $user->doctor?->id : $admission->doctor_id;
        $action->handle($admission, $user, $doctorId, $data);

        Toast::success("Alta de {$admission->patient->full_name}. La cuenta de la estancia pasa a Facturación.");

        return redirect()->route('internamiento');
    }

    private function ensureActive(Admission $admission): void
    {
        if (! $admission->isActive()) {
            throw ValidationException::withMessages(['admission' => 'El paciente ya fue dado de alta.']);
        }
    }
}
