<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Cirugia\AdvanceSurgery;
use App\Actions\Cirugia\ScheduleSurgery;
use App\Http\Controllers\Controller;
use App\Http\Requests\SurgeryRequest;
use App\Models\Patient;
use App\Models\Surgery;
use App\Models\User;
use App\Support\SurgeryPresenter;
use App\Support\Toast;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Cirugía: weekly operating room agenda */
class CirugiaController extends Controller
{
    public function index(Request $request, SurgeryPresenter $presenter): Response
    {
        /** @var User $user */
        $user = $request->user();
        $week = $this->weekStart($request->string('semana')->toString());

        $surgeries = Surgery::with(['patient', 'surgeon', 'anesthetist', 'operatingRoom', 'admission.bed.room'])
            ->where('starts_at', '>=', $week)
            ->where('starts_at', '<', $week->addDays(7))
            ->orderBy('starts_at')
            ->get();

        return Inertia::render('cirugia/index', [
            'week_start' => $week->toDateString(),
            'today' => today()->toDateString(),
            'surgeries' => $surgeries->map(fn (Surgery $s): array => $presenter->block($s))->values()->all(),
            'selected_id' => $request->integer('cirugia') ?: null,
            'options' => $presenter->options(),
            'can_schedule' => SurgeryRequest::canSchedule($user),
            'can_advance' => self::canAdvance($user),
        ]);
    }

    public function store(SurgeryRequest $request, ScheduleSurgery $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $patient = Patient::findOrFail($request->integer('patient_id'));
        $surgery = $action->handle($patient, $request->validated(), $request->startsAt(), $request->endsAt(), $user);

        Toast::success("{$surgery->procedure_name} programada para {$patient->full_name} · {$surgery->starts_at->format('d/m/Y H:i')}.");

        return redirect()->route('cirugia', ['semana' => $surgery->starts_at->toDateString(), 'cirugia' => $surgery->id]);
    }

    public function reschedule(SurgeryRequest $request, Surgery $surgery, ScheduleSurgery $action): RedirectResponse
    {
        $action->reschedule($surgery, $request->integer('operating_room_id'), $request->startsAt(), $request->endsAt());
        $surgery->refresh();

        Toast::success("{$surgery->procedure_name} reprogramada para el {$surgery->starts_at->format('d/m/Y H:i')}.");

        return redirect()->route('cirugia', ['semana' => $surgery->starts_at->toDateString(), 'cirugia' => $surgery->id]);
    }

    public function cancel(Request $request, Surgery $surgery): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(SurgeryRequest::canSchedule($user), 403);
        $reason = (string) $request->validate(
            ['reason' => ['required', 'string', 'max:255']],
            ['reason.required' => 'Indica por qué se cancela.'],
        )['reason'];
        if ($surgery->status !== 'programada') {
            return back()->withErrors(['surgery' => 'Solo se cancela una cirugía programada.']);
        }
        $surgery->update(['status' => 'cancelada', 'cancelled_at' => now(), 'cancelled_by' => $user->id, 'cancel_reason' => trim($reason)]);

        Toast::success("{$surgery->procedure_name} cancelada. No se cobra.");

        return back();
    }

    public function advance(Request $request, Surgery $surgery, AdvanceSurgery $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(self::canAdvance($user), 403);
        $action->handle($surgery, $user);
        $surgery->refresh();

        Toast::success($surgery->status === 'realizada'
            ? "{$surgery->procedure_name} realizada y cargada a la cuenta."
            : "{$surgery->procedure_name}: en quirófano.");

        return back();
    }

    /** Doctors, nursing and the administrator move a surgery forward */
    public static function canAdvance(User $user): bool
    {
        return $user->can('module.cirugia.access')
            && ($user->canAttendPatients() || $user->hasAnyRole(['administrador', 'enfermeria']));
    }

    private function weekStart(string $date): CarbonImmutable
    {
        $day = preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1 ? CarbonImmutable::parse($date) : CarbonImmutable::today();

        return $day->startOfWeek(CarbonImmutable::MONDAY)->startOfDay();
    }
}
