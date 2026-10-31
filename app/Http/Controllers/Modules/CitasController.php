<?php

namespace App\Http\Controllers\Modules;

use App\Actions\CreateAppointment;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CitasController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $ownOnly = $user->seesOnlyOwnSchedule();
        $forceDoctorId = $ownOnly ? $user->doctor->id : null;

        $date = $request->filled('date')
            ? Carbon::parse($request->string('date'))->toDateString()
            : today()->toDateString();

        $isToday = Carbon::parse($date)->isToday();

        $appointments = Appointment::with(['patient', 'doctor.specialty', 'turn'])
            ->whereHas('patient')
            ->whereDate('appointment_date', $date)
            ->when(
                $forceDoctorId !== null,
                fn ($q) => $q->where('doctor_id', $forceDoctorId),
                fn ($q) => $q->when(
                    $request->filled('doctor_id'),
                    fn ($q2) => $q2->where('doctor_id', $request->integer('doctor_id'))
                )
            )
            ->orderBy('appointment_time')
            ->get()
            ->map(fn (Appointment $a) => [
                'id' => $a->id,
                'patient_id' => $a->patient_id,
                'patient_name' => $a->patient->full_name,
                'patient_initials' => $a->patient->initials,
                'doctor_id' => $a->doctor_id,
                'doctor_name' => $a->doctor->name,
                'doctor_specialty' => $a->doctor->specialty->name,
                'appointment_date' => $a->appointment_date->format('Y-m-d'),
                'appointment_time' => $a->appointment_time,
                'type' => $a->type,
                'status' => $a->status,
                'notes' => $a->notes,
                'turn_number' => $a->turn?->turn_number,
            ]);

        $doctors = Doctor::with('specialty')
            ->where('is_active', true)
            ->when($forceDoctorId !== null, fn ($q) => $q->where('id', $forceDoctorId))
            ->orderBy('name')
            ->get()
            ->map(fn (Doctor $d) => [
                'id' => $d->id,
                'name' => $d->name,
                'specialty' => $d->specialty->name,
                'initials' => collect(explode(' ', (string) preg_replace('/^(Dr\.|Dra\.)\s*/i', '', $d->name)))
                    ->map(fn (string $w) => strtoupper($w[0] ?? ''))
                    ->take(2)
                    ->join(''),
            ]);

        return Inertia::render('citas/index', [
            'appointments' => $appointments,
            'doctors' => $doctors,
            'date' => $date,
            'is_today' => $isToday,
        ]);
    }

    public function store(StoreAppointmentRequest $request, CreateAppointment $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        // Non-admin doctor can only create appointments for themselves
        if ($user->seesOnlyOwnSchedule()) {
            $data['doctor_id'] = $user->doctor->id;
        }

        $action->handle($data);

        Toast::success('Cita registrada correctamente.');

        return redirect()->route('citas', ['date' => $request->input('appointment_date')]);
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        if ($user->seesOnlyOwnSchedule() && $appointment->doctor_id !== $user->doctor->id) {
            abort(403);
        }

        $appointment->update($request->validated());

        Toast::success('Cita actualizada.');

        return redirect()->route('citas', ['date' => $appointment->appointment_date->format('Y-m-d')]);
    }

    public function cancel(Appointment $appointment): RedirectResponse
    {
        /** @var User $user */
        $user = auth()->user();
        abort_unless($user?->can('module.citas.access'), 403);

        if ($user->seesOnlyOwnSchedule() && $appointment->doctor_id !== $user->doctor->id) {
            abort(403);
        }

        $appointment->update(['status' => 'cancelada']);

        Toast::success('Cita cancelada.');

        return redirect()->route('citas', ['date' => $appointment->appointment_date->format('Y-m-d')]);
    }
}
