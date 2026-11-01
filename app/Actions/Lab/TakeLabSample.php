<?php

namespace App\Actions\Lab;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\LabOrder;
use App\Models\LabOrderItem;
use App\Models\LabTestParameter;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The sample is taken: the analyses are done in the clinic, so each one is
 * charged now (ADR-018) and its results are prepared from the parameters
 * of the catalog (a copy, so later catalog changes don't alter them).
 */
class TakeLabSample
{
    public function __construct(
        private readonly GetOrOpenDailyAccount $getOrOpenDailyAccount,
        private readonly CloseDailyAccountIfDone $closeDailyAccount,
    ) {}

    public function handle(LabOrder $order, User $user): LabOrder
    {
        return DB::transaction(function () use ($order, $user): LabOrder {
            $order = LabOrder::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if ($order->status !== 'ordenada') {
                throw ValidationException::withMessages(['order' => 'La muestra de esta orden ya se registró.']);
            }

            $account = $this->accountFor($order);

            foreach ($order->items()->with('test.parameters')->get() as $item) {
                /** @var LabOrderItem $item */
                $charge = AccountCharge::create([
                    'account_id' => $account->id,
                    'doctor_id' => $order->doctor_id,
                    'created_by' => $user->id,
                    'type' => 'laboratorio',
                    'description' => $item->name,
                    'quantity' => 1,
                    'unit_price' => $item->price,
                    'total' => $item->price,
                    'source_type' => LabOrderItem::class,
                    'source_id' => $item->id,
                ]);
                $item->update(['account_charge_id' => $charge->id]);

                foreach ($item->test->parameters as $parameter) {
                    /** @var LabTestParameter $parameter */
                    $item->results()->create([
                        'lab_test_parameter_id' => $parameter->id,
                        'position' => $parameter->position,
                        'name' => $parameter->name,
                        'reference' => $parameter->referenceText(),
                    ]);
                }
            }

            $order->update(['status' => 'muestra', 'sample_at' => now(), 'sample_by' => $user->id]);

            // A patient with nothing else open that day goes straight to billing
            $this->closeDailyAccount->handle($order->patient, $account->service_date);

            return $order;
        });
    }

    /** The emergency account while it is open; otherwise the patient's account of the day */
    private function accountFor(LabOrder $order): Account
    {
        $emergencyAccount = $order->emergency?->account;
        if ($emergencyAccount !== null && $emergencyAccount->status === 'abierta') {
            return $emergencyAccount;
        }

        return $this->getOrOpenDailyAccount->handle($order->patient, now());
    }
}
