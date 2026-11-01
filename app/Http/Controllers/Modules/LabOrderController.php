<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Emergencia\EnsureEmergencyActive;
use App\Actions\Lab\CreateLabOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\LabOrderRequest;
use App\Models\Emergency;
use App\Models\LabOrder;
use App\Models\Turn;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Laboratory orders from Consulta and Emergencia */
class LabOrderController extends Controller
{
    public function storeFromTurn(LabOrderRequest $request, Turn $turn, CreateLabOrder $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $order = $action->handle($turn->patient, 'consulta', [
            'turn_id' => $turn->id,
            'doctor_id' => $turn->doctor_id,
        ], $request->testIds(), $request->validated('indication'), $user);

        Toast::success("Orden {$order->number} enviada a Laboratorio.");

        return back();
    }

    public function storeFromEmergency(LabOrderRequest $request, Emergency $emergency, CreateLabOrder $action): RedirectResponse
    {
        EnsureEmergencyActive::check($emergency);
        /** @var User $user */
        $user = $request->user();

        $order = $action->handle($emergency->patient, 'emergencia', [
            'emergency_id' => $emergency->id,
            'doctor_id' => $emergency->doctor_id,
        ], $request->testIds(), $request->validated('indication'), $user);

        Toast::success("Orden {$order->number} enviada a Laboratorio.");

        return back();
    }

    /** An order not started is cancelled (e.g. the patient does it elsewhere) */
    public function cancel(Request $request, LabOrder $order): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless(
            $user->can('module.lab.access') || $user->can('module.consulta.access') || $user->can('module.emergencia.access'),
            403,
        );
        $reason = (string) $request->validate(
            ['reason' => ['required', 'string', 'max:255']],
            ['reason.required' => 'Indica por qué se cancela.'],
        )['reason'];

        if ($order->status !== 'ordenada') {
            throw ValidationException::withMessages(['order' => 'Solo se cancela una orden antes de tomar la muestra.']);
        }

        $order->update([
            'status' => 'cancelada',
            'cancelled_at' => now(),
            'cancelled_by' => $user->id,
            'cancel_reason' => trim($reason),
        ]);

        Toast::success("Orden {$order->number} cancelada.");

        return back();
    }
}
