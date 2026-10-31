<?php

namespace App\Actions\Caja;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoidInvoice
{
    /**
     * Void an invoice with a reason. It stops counting anywhere and its
     * account goes back to pending billing, so it can be invoiced again.
     * An invoice with payments needs those payments refunded first.
     */
    public function handle(Invoice $invoice, User $user, string $reason): Invoice
    {
        return DB::transaction(function () use ($invoice, $user, $reason): Invoice {
            $invoice = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if ($invoice->status === 'anulada') {
                throw ValidationException::withMessages(['invoice' => 'Esta factura ya está anulada.']);
            }

            if ($invoice->paid_amount > 0) {
                throw ValidationException::withMessages([
                    'invoice' => 'Esta factura tiene pagos. Anula los pagos antes de anular la factura.',
                ]);
            }

            $invoice->update([
                'status' => 'anulada',
                'voided_by' => $user->id,
                'voided_at' => now(),
                'void_reason' => trim($reason),
            ]);

            $invoice->account()->update(['status' => 'pendiente_facturar']);

            return $invoice;
        });
    }
}
