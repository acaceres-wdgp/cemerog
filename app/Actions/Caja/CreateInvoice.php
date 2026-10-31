<?php

namespace App\Actions\Caja;

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateInvoice
{
    /**
     * Issue the invoice of a daily account that is pending billing, with all
     * its charges in a single invoice and an optional discount (up to 100%).
     * The discount lowers each doctor fee in the same proportion.
     */
    public function handle(Account $account, User $user, ?string $discountType = null, ?int $discountValue = null, ?string $discountReason = null): Invoice
    {
        return DB::transaction(function () use ($account, $user, $discountType, $discountValue, $discountReason): Invoice {
            $account = Account::whereKey($account->id)->lockForUpdate()->firstOrFail();

            if ($account->status !== 'pendiente_facturar') {
                throw ValidationException::withMessages([
                    'account' => $account->status === 'facturada'
                        ? 'Esta cuenta ya fue facturada.'
                        : 'Solo se facturan cuentas pendientes de facturar (después del alta).',
                ]);
            }

            $charges = $account->charges()->orderBy('id')->get();
            $subtotal = (int) $charges->sum('total');
            $discount = $this->discountAmount($subtotal, $discountType, $discountValue);

            if ($discount > 0 && trim((string) $discountReason) === '') {
                throw ValidationException::withMessages(['discount_reason' => 'Indica el motivo del descuento.']);
            }

            $total = $subtotal - $discount;

            $invoice = Invoice::create([
                'account_id' => $account->id,
                'patient_id' => $account->patient_id,
                'status' => $total === 0 ? 'pagada' : 'pendiente',
                'subtotal' => $subtotal,
                'discount_type' => $discount > 0 ? $discountType : null,
                'discount_value' => $discount > 0 ? $discountValue : null,
                'discount_amount' => $discount,
                'discount_reason' => $discount > 0 ? trim((string) $discountReason) : null,
                'total' => $total,
                'issued_by' => $user->id,
                'issued_at' => now(),
            ]);
            $invoice->update(['number' => Invoice::formatNumber($invoice->id)]);

            foreach ($charges as $charge) {
                $invoice->lines()->create([
                    'account_charge_id' => $charge->id,
                    'type' => $charge->type,
                    'description' => $charge->description,
                    'quantity' => $charge->quantity,
                    'unit_price' => $charge->unit_price,
                    'total' => $charge->total,
                    'doctor_id' => $charge->doctor_id,
                    'doctor_fee' => $this->netFee($charge, $subtotal, $total),
                ]);
            }

            $account->update(['status' => 'facturada']);

            return $invoice;
        });
    }

    private function discountAmount(int $subtotal, ?string $type, ?int $value): int
    {
        if ($type === null || $value === null || $value <= 0) {
            return 0;
        }

        if ($type === 'porcentaje') {
            if ($value > 100) {
                throw ValidationException::withMessages(['discount_value' => 'El descuento no puede pasar del 100%.']);
            }

            return (int) round($subtotal * $value / 100);
        }

        if ($value > $subtotal) {
            throw ValidationException::withMessages(['discount_value' => 'El descuento no puede ser mayor que el total.']);
        }

        return $value;
    }

    /** The doctor fee reduced in the same proportion as the invoice total */
    private function netFee(AccountCharge $charge, int $subtotal, int $total): ?int
    {
        if ($charge->doctor_fee === null) {
            return null;
        }

        return $subtotal === 0 ? 0 : (int) round($charge->doctor_fee * $total / $subtotal);
    }
}
