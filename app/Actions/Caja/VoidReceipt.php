<?php

namespace App\Actions\Caja;

use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoidReceipt
{
    /**
     * Void a receipt (the money is given back). Only receipts of the shift
     * still open can be voided, so a closed cash count never changes.
     */
    public function handle(Receipt $receipt, User $user, string $reason): Receipt
    {
        return DB::transaction(function () use ($receipt, $user, $reason): Receipt {
            $receipt = Receipt::with('shift')->whereKey($receipt->id)->lockForUpdate()->firstOrFail();

            if ($receipt->voided_at !== null) {
                throw ValidationException::withMessages(['receipt' => 'Este recibo ya está anulado.']);
            }

            if (! $receipt->shift->isOpen()) {
                throw ValidationException::withMessages([
                    'receipt' => 'El turno de este recibo ya se cerró; no se puede anular.',
                ]);
            }

            $receipt->update([
                'voided_by' => $user->id,
                'voided_at' => now(),
                'void_reason' => trim($reason),
            ]);

            $invoice = Invoice::whereKey($receipt->invoice_id)->lockForUpdate()->firstOrFail();
            $invoice->paid_amount = max(0, $invoice->paid_amount - $receipt->total);
            if ($invoice->status === 'pagada' && $invoice->paid_amount < $invoice->total) {
                $invoice->status = 'pendiente';
            }
            $invoice->save();

            return $receipt;
        });
    }
}
