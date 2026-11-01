<?php

namespace App\Actions\Img;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\ImagingOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * «Estudio realizado»: the study was done in the clinic, so it is charged
 * now (ADR-018) to the open emergency account or the account of the day.
 */
class PerformImagingStudy
{
    public function __construct(
        private readonly GetOrOpenDailyAccount $getOrOpenDailyAccount,
        private readonly CloseDailyAccountIfDone $closeDailyAccount,
    ) {}

    public function handle(ImagingOrder $order, User $user): ImagingOrder
    {
        return DB::transaction(function () use ($order, $user): ImagingOrder {
            $order = ImagingOrder::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($order->status !== 'ordenada') {
                throw ValidationException::withMessages(['order' => 'Este estudio ya se registró como realizado.']);
            }

            $account = $this->accountFor($order);
            $charge = AccountCharge::create([
                'account_id' => $account->id,
                'doctor_id' => $order->doctor_id,
                'created_by' => $user->id,
                'type' => 'imagen',
                'description' => $order->name,
                'quantity' => 1,
                'unit_price' => $order->price,
                'total' => $order->price,
                'source_type' => ImagingOrder::class,
                'source_id' => $order->id,
            ]);

            $order->update([
                'status' => 'realizado',
                'performed_at' => now(),
                'performed_by' => $user->id,
                'account_charge_id' => $charge->id,
            ]);

            // A patient with nothing else open that day goes straight to billing
            $this->closeDailyAccount->handle($order->patient, $account->service_date);

            return $order;
        });
    }

    /** The emergency account while it is open; otherwise the patient's account of the day */
    private function accountFor(ImagingOrder $order): Account
    {
        $emergencyAccount = $order->emergency?->account;
        if ($emergencyAccount !== null && $emergencyAccount->status === 'abierta') {
            return $emergencyAccount;
        }

        return $this->getOrOpenDailyAccount->handle($order->patient, now());
    }
}
