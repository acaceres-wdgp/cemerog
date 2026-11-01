<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Internamiento\AdmitPatient;
use App\Actions\Internamiento\MoveAdmission;
use App\Http\Controllers\Controller;
use App\Http\Requests\AdmitPatientRequest;
use App\Models\Admission;
use App\Models\Bed;
use App\Models\Emergency;
use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;
use App\Support\AdmissionPresenter;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    public function admit(AdmitPatientRequest $request, AdmitPatient $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $patient = Patient::findOrFail($request->integer('patient_id'));
        $emergency = $request->filled('emergency_id') ? Emergency::findOrFail($request->integer('emergency_id')) : null;
        $turn = $request->filled('turn_id') ? Turn::findOrFail($request->integer('turn_id')) : null;
        if ($emergency !== null && $emergency->patient_id !== $patient->id || $turn !== null && $turn->patient_id !== $patient->id) {
            throw ValidationException::withMessages(['patient_id' => 'La atención no corresponde a este paciente.']);
        }

        $admission = $action->handle($patient, [
            'bed_id' => $request->integer('bed_id'),
            'doctor_id' => $request->integer('doctor_id'),
            'diagnosis' => (string) $request->validated('diagnosis'),
            'treatment' => $request->validated('treatment'),
        ], $user, $emergency, $turn);

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
