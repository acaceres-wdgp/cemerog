<?php

namespace App\Actions\Accounts;

use App\Models\Account;
use App\Models\Patient;
use App\Models\Turn;
use Carbon\CarbonInterface;

class CloseDailyAccountIfDone
{
    /**
     * If no open turns remain for the patient on the given day (today by default),
     * transition that day's account to its terminal status:
     *   - pendiente_facturar  when the account still has charges
     *   - anulada             when the account is empty (all charges were removed)
     */
    public function handle(Patient $patient, ?CarbonInterface $day = null): void
    {
        $day ??= today();

        $hasOpenTurns = Turn::where('patient_id', $patient->id)
            ->whereDate('arrived_at', $day)
            ->whereIn('status', ['espera', 'en_consulta'])
            ->exists();

        if ($hasOpenTurns) {
            return;
        }

        $account = Account::where('patient_id', $patient->id)
            ->whereDate('service_date', $day)
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
