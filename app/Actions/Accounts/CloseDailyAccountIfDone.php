<?php

namespace App\Actions\Accounts;

use App\Models\Account;
use App\Models\Patient;
use App\Models\Turn;

class CloseDailyAccountIfDone
{
    /**
     * If no open turns remain for the patient today, transition the daily account
     * to its terminal status:
     *   - pendiente_facturar  when the account still has charges
     *   - anulada             when the account is empty (all charges were removed)
     */
    public function handle(Patient $patient): void
    {
        $hasOpenTurns = Turn::where('patient_id', $patient->id)
            ->whereDate('arrived_at', today())
            ->whereIn('status', ['espera', 'en_consulta'])
            ->exists();

        if ($hasOpenTurns) {
            return;
        }

        $account = Account::where('patient_id', $patient->id)
            ->whereDate('service_date', today())
            ->where('status', 'abierta')
            ->first();

        if ($account === null) {
            return;
        }

        $hasCharges = $account->charges()->exists();

        $account->update([
            'status' => $hasCharges ? 'pendiente_facturar' : 'anulada',
            'closed_at' => now(),
        ]);
    }
}
