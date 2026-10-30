<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Actions\Registro\RegisterArrival;
use App\Actions\ReorderTurn;
use App\Exceptions\PatientHasOpenTurnException;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTurnRequest;
use App\Http\Requests\UpdateTurnStatusRequest;
use App\Models\AccountCharge;
use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class TurnosController extends Controller
{
    /**
     * Assign a turn via RegisterArrival so the "open turn today" check is enforced
     * and all arrival logic lives in a single place.
     */
    public function store(StoreTurnRequest $request, RegisterArrival $registerArrival): RedirectResponse
    {
        $validated = $request->validated();

        $patient = Patient::findOrFail($validated['patient_id']);

        try {
            $turn = $registerArrival->handle(
                $patient,
                [],   // no patient-data changes from this endpoint
                [
                    'doctor_id' => $validated['doctor_id'],
                    'appointment_id' => $validated['appointment_id'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]
            );
        } catch (PatientHasOpenTurnException $e) {
            return back()->withErrors(['open_turn' => $e->getMessage()]);
        }

        Toast::success('Turno asignado correctamente.');

        return redirect()->route('tablero');
    }

    public function updateStatus(UpdateTurnStatusRequest $request, Turn $turn): RedirectResponse
    {
        $newStatus = $request->validated()['status'];

        if ($newStatus === 'no_asistio') {
            $patient = $turn->patient;

            DB::transaction(function () use ($turn, $newStatus, $patient): void {
                $turn->update(['status' => $newStatus]);

                // Remove the consultation charge for this turn
                AccountCharge::where('turn_id', $turn->id)
                    ->where('type', 'consulta')
                    ->delete();

                app(CloseDailyAccountIfDone::class)->handle($patient);
            });
        } else {
            $turn->update(['status' => $newStatus]);
        }

        Toast::success('Estado del turno actualizado.');

        return redirect()->route('tablero');
    }

    public function reorder(Request $request, Turn $turn, ReorderTurn $action): RedirectResponse
    {
        abort_unless(auth()->user()?->can('module.tablero.access'), 403);

        $request->validate(['direction' => 'required|in:up,down']);

        $action->handle($turn, (string) $request->input('direction'));

        return redirect()->route('tablero');
    }

    /**
     * Advance the next waiting turn (lowest turn_order) for the authenticated
     * doctor's queue to "en_consulta". Only available to users with a linked doctor.
     */
    public function callNext(Request $request): RedirectResponse|JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user->doctor !== null, 403);

        $doctorId = $user->doctor->id;
        $today = Carbon::today();

        // Prevent calling the next patient if one is already in consultation
        $inConsulta = Turn::where('doctor_id', $doctorId)
            ->where('status', 'en_consulta')
            ->whereDate('arrived_at', $today)
            ->first();

        if ($inConsulta !== null) {
            $label = 'T-'.str_pad((string) $inConsulta->turn_number, 2, '0', STR_PAD_LEFT);

            return back()->withErrors([
                'queue' => "Ya tienes un paciente en consulta ({$label}). Termina la consulta antes de llamar al siguiente.",
            ]);
        }

        $next = Turn::where('doctor_id', $doctorId)
            ->where('status', 'espera')
            ->whereDate('arrived_at', $today)
            ->orderBy('turn_order')
            ->first();

        if ($next === null) {
            return back()->withErrors(['queue' => 'No hay pacientes en espera.']);
        }

        $next->update(['status' => 'en_consulta']);

        Toast::success('Paciente llamado.');

        return back();
    }
}
