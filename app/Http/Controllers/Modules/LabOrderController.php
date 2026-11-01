<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\LabOrder;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Laboratory orders: cancel one not started yet */
class LabOrderController extends Controller
{
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
