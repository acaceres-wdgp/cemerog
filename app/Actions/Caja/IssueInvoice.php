<?php

namespace App\Actions\Caja;

use App\Models\Account;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class IssueInvoice
{
    public function __construct(
        private readonly CreateInvoice $createInvoice,
        private readonly RecordPayment $recordPayment,
    ) {}

    /**
     * Emit the invoice of an account and, in the same step, collect it or
     * send it to credit. If the payment is rejected, nothing is issued.
     *
     * @param  array{type?: string|null, value?: int|null, reason?: string|null}  $discount
     * @param  list<array{method: string, amount: int, cash_received?: int|null, reference?: string|null}>  $payments
     * @param  array{due_date: string, note?: string|null}|null  $credit
     * @return array{invoice: Invoice, receipt: Receipt|null}
     */
    public function handle(Account $account, User $user, array $discount, array $payments, ?array $credit): array
    {
        return DB::transaction(function () use ($account, $user, $discount, $payments, $credit): array {
            $invoice = $this->createInvoice->handle(
                $account,
                $user,
                $discount['type'] ?? null,
                $discount['value'] ?? null,
                $discount['reason'] ?? null,
            );

            $receipt = null;
            if ($invoice->status === 'pendiente' && ($payments !== [] || $credit !== null)) {
                $receipt = $this->recordPayment->handle($invoice, $user, $payments, $credit);
            }

            return ['invoice' => $invoice->fresh() ?? $invoice, 'receipt' => $receipt];
        });
    }
}
