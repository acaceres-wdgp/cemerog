<?php

namespace App\Actions\Cirugia;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Models\AccountCharge;
use App\Models\Surgery;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * «Pasar a quirófano» → «Marcar como realizada». When performed it is
 * charged (ADR-024): to the stay's account if admitted, otherwise to the
 * patient's account of the day, which then goes to billing if nothing else
 * is open.
 */
class AdvanceSurgery
{
    public function __construct(
        private readonly GetOrOpenDailyAccount $getOrOpenDailyAccount,
        private readonly CloseDailyAccountIfDone $closeAccount,
    ) {}

    public function handle(Surgery $surgery, User $user): Surgery
    {
        return DB::transaction(function () use ($surgery, $user): Surgery {
            $surgery = Surgery::whereKey($surgery->id)->lockForUpdate()->firstOrFail();

            if ($surgery->status === 'programada') {
                $surgery->update(['status' => 'quirofano', 'started_at' => now()]);

                return $surgery;
            }
            if ($surgery->status !== 'quirofano') {
                throw ValidationException::withMessages(['surgery' => 'Esta cirugía ya está cerrada.']);
            }

            $account = $this->getOrOpenDailyAccount->handle($surgery->patient, now());
            $charge = AccountCharge::create([
                'account_id' => $account->id,
                'doctor_id' => $surgery->surgeon_id,
                'created_by' => $user->id,
                'type' => 'cirugia',
                'description' => $surgery->procedure_name,
                'quantity' => 1,
                'unit_price' => $surgery->price,
                'total' => $surgery->price,
                'source_type' => Surgery::class,
                'source_id' => $surgery->id,
            ]);
            $surgery->update(['status' => 'realizada', 'performed_at' => now(), 'account_charge_id' => $charge->id]);

            $this->closeAccount->handle($surgery->patient, $account->service_date);

            return $surgery;
        });
    }
}
