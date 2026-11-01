<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Cirugia\ScheduleSurgery;
use App\Actions\Internamiento\AdmitPatient;
use App\Actions\Internamiento\MoveAdmission;
use App\Http\Controllers\Controller;
use App\Http\Requests\AdmitPatientRequest;
use App\Http\Requests\SurgeryRequest;
use App\Models\Admission;
use App\Models\Bed;
use App\Models\Emergency;
use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;
use App\Support\AdmissionPresenter;
use App\Support\Toast;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Internamiento: bed map, admission, transfers and beds ready after cleaning */
class InternamientoController extends Controller
{
    public function index(Request $request, AdmissionPresenter $presenter): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('internamiento/index', [
            'rooms' => $presenter->rooms(),
            'admission_options' => $presenter->options($user),
            // A free bed clicked on the map comes preselected
            'selected_bed_id' => $request->integer('cama') ?: null,
        ]);
    }

    public function admit(AdmitPatientRequest $request, AdmitPatient $action, ScheduleSurgery $schedule): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $patient = Patient::findOrFail($request->integer('patient_id'));
        $emergency = $request->filled('emergency_id') ? Emergency::findOrFail($request->integer('emergency_id')) : null;
        $turn = $request->filled('turn_id') ? Turn::findOrFail($request->integer('turn_id')) : null;
        if ($emergency !== null && $emergency->patient_id !== $patient->id || $turn !== null && $turn->patient_id !== $patient->id) {
            throw ValidationException::withMessages(['patient_id' => 'La atención no corresponde a este paciente.']);
        }

        /** @var array<string, mixed>|null $surgery */
        $surgery = $request->validated('surgery');
        if ($surgery !== null && ! SurgeryRequest::canSchedule($user)) {
            abort(403);
        }

        [$admission, $scheduled] = DB::transaction(function () use ($action, $schedule, $patient, $request, $user, $emergency, $turn, $surgery): array {
            $admission = $action->handle($patient, [
                'bed_id' => $request->integer('bed_id'),
                'doctor_id' => $request->integer('doctor_id'),
                'diagnosis' => (string) $request->validated('diagnosis'),
                'treatment' => $request->validated('treatment'),
            ], $user, $emergency, $turn);

            $scheduled = null;
            if ($surgery !== null) {
                $startsAt = CarbonImmutable::createFromFormat('Y-m-d H:i', $surgery['date'].' '.$surgery['time']);
                $scheduled = $schedule->handle($patient, $surgery, $startsAt, $startsAt->addMinutes((int) $surgery['duration_minutes']), $user);
            }

            return [$admission, $scheduled];
        });

        if ($scheduled !== null) {
            Toast::success("{$patient->full_name} ingresado en {$admission->bed?->label()}. {$scheduled->procedure_name} programada para el {$scheduled->starts_at->format('d/m/Y H:i')}.");

            return redirect()->route('cirugia', ['semana' => $scheduled->starts_at->toDateString(), 'cirugia' => $scheduled->id]);
        }

        Toast::success("{$patient->full_name} internado en {$admission->bed?->label()}. Estado: Internado.");

        return redirect()->route('internamiento.show', $admission);
    }

    public function move(Request $request, Admission $admission, MoveAdmission $action): RedirectResponse
    {
        $data = $request->validate([
            'bed_id' => ['required', 'integer', 'exists:beds,id'],
            'reason' => ['nullable', 'string', 'max:255'],
        ], ['bed_id.required' => 'Elige una cama libre.']);
        /** @var User $user */
        $user = $request->user();
        $previous = $admission->bed?->label();
        $action->handle($admission, (int) $data['bed_id'], $data['reason'] ?? null, $user);
        $admission->refresh();

        Toast::success("{$admission->patient->full_name} trasladado a {$admission->bed?->label()}. {$previous} quedó en limpieza.");

        return back();
    }

    /** «Marcar lista»: a bed in cleaning can receive a patient again */
    public function bedReady(Bed $bed): RedirectResponse
    {
        if ($bed->status !== 'limpieza') {
            return back()->withErrors(['bed' => 'La cama no está en limpieza.']);
        }
        $bed->update(['status' => 'libre', 'cleaning_since' => null]);

        Toast::success("{$bed->label()} lista para recibir paciente.");

        return back();
    }
}
