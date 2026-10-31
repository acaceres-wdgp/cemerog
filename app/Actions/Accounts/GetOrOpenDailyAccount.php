<?php

namespace App\Actions\Accounts;

use App\Models\Account;
use App\Models\Patient;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

// Note: lockForUpdate() on the patient row (done in RegisterArrival) already
// serialises access in MySQL. The lock here is a belt-and-suspenders guard for
// callers that do not go through RegisterArrival.

class GetOrOpenDailyAccount
{
    /**
     * Get or create an open account for the patient on the given date. An
     * account of that day still pending billing is reopened (ADR-018).
     *
     * Uses lockForUpdate() inside a transaction to prevent two concurrent
     * arrivals from creating two separate open accounts on the same day.
     */
    public function handle(Patient $patient, CarbonInterface $date): Account
    {
        return DB::transaction(function () use ($patient, $date): Account {
            // A same-day account not billed yet (closed at the last discharge)
            // is reopened so the whole day goes in a single invoice.
            $existing = Account::where('patient_id', $patient->id)
                ->whereDate('service_date', $date)
                ->whereIn('status', ['abierta', 'pendiente_facturar'])
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                if ($existing->status === 'pendiente_facturar') {
                    $existing->update(['status' => 'abierta', 'closed_at' => null]);
                }

                return $existing;
            }

            return Account::create([
                'patient_id' => $patient->id,
                'service_date' => $date->toDateString(),
                'status' => 'abierta',
                'opened_at' => now(),
            ]);
        });
    }
}
