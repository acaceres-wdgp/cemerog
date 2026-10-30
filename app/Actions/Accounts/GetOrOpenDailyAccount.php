<?php

namespace App\Actions\Accounts;

use App\Models\Account;
use App\Models\Patient;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GetOrOpenDailyAccount
{
    /**
     * Get or create an open account for the patient on the given date.
     *
     * Uses lockForUpdate() inside a transaction to prevent two concurrent
     * arrivals from creating two separate open accounts on the same day.
     */
    public function handle(Patient $patient, Carbon $date): Account
    {
        return DB::transaction(function () use ($patient, $date): Account {
            $existing = Account::where('patient_id', $patient->id)
                ->whereDate('service_date', $date)
                ->where('status', 'abierta')
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
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
