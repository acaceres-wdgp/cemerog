<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Emergencia\AdmitToEmergency;
use App\Http\Controllers\Controller;
use App\Http\Requests\TransferToEmergencyRequest;
use App\Models\Turn;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * «Pasar a emergencia» from consulta: the consulta ends as attended and the
 * patient is admitted to emergency with the same doctor. The account stays
 * open, so the emergency fee joins the consultation charge (ADR-018).
 */
class ConsultaTransferController extends Controller
{
    public function toEmergency(TransferToEmergencyRequest $request, Turn $turn, AdmitToEmergency $admit): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $emergency = DB::transaction(function () use ($request, $turn, $admit, $user) {
            $emergency = $admit->handle(
                $turn->patient,
                null,
                $request->integer('cubicle_id'),
                $turn->doctor_id,
                (string) $request->validated('reason'),
                $user,
                $turn->id,
            );
            $turn->update(['status' => 'atendido']);

            return $emergency;
        });

        Toast::success("Turno T-{$turn->turn_number} trasladado a Emergencia · {$emergency->cubicle->name}. La cuenta se mantiene.");

        return redirect()->route('emergencia.show', $emergency);
    }
}
