<?php

namespace App\Actions\Accounts;

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Turn;
use App\Models\User;

class AddConsultationCharge
{
    /**
     * Add a consultation charge to the account for the given turn.
     *
     * Captures doctor's consultation_price and consultation_fee at this moment
     * so that future price changes do not affect saved charges.
     */
    public function handle(Account $account, Turn $turn, User $createdBy): AccountCharge
    {
        $doctor = $turn->doctor;
        $price = $doctor->consultation_price;
        $fee = $doctor->consultation_fee;

        return AccountCharge::create([
            'account_id' => $account->id,
            'turn_id' => $turn->id,
            'doctor_id' => $doctor->id,
            'created_by' => $createdBy->id,
            'type' => 'consulta',
            'description' => "Consulta – {$doctor->name}",
            'quantity' => 1,
            'unit_price' => $price,
            'total' => $price,
            'doctor_fee' => $fee > 0 ? $fee : null,
        ]);
    }
}
