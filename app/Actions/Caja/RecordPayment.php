<?php

namespace App\Actions\Caja;

use App\Models\CashShift;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordPayment
{
    /**
     * Collect money for an invoice in the open shift. Several methods can be
     * combined in one receipt. A balance left unpaid stays on the invoice and
     * shows in accounts receivable; choosing credit records its due date.
     *
     * @param  list<array{method: string, amount: int, cash_received?: int|null, reference?: string|null}>  $lines
     * @param  array{due_date: string, note?: string|null}|null  $credit
     */
    public function handle(Invoice $invoice, User $user, array $lines, ?array $credit = null): ?Receipt
    {
        return DB::transaction(function () use ($invoice, $user, $lines, $credit): ?Receipt {
            $invoice = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if ($invoice->status !== 'pendiente') {
                throw ValidationException::withMessages([
                    'invoice' => $invoice->status === 'anulada'
                        ? 'La factura está anulada.'
                        : 'La factura ya está pagada.',
                ]);
            }

            $lines = array_values(array_filter($lines, fn (array $l): bool => (int) $l['amount'] > 0));
            $paying = array_sum(array_map(fn (array $l): int => (int) $l['amount'], $lines));
            $balance = $invoice->balance();

            if ($paying > $balance) {
                throw ValidationException::withMessages([
                    'payments' => 'El pago ('.Money::format($paying).') es mayor que el balance ('.Money::format($balance).').',
                ]);
            }

            // A partial payment just leaves a balance (it can be paid in several
            // steps). Choosing credit records the due date of that balance.
            if ($credit !== null && $paying < $balance) {
                $this->applyCredit($invoice, $credit);
            } elseif ($paying === 0) {
                throw ValidationException::withMessages(['payments' => 'Indica el monto a pagar.']);
            }

            // Money needs an open shift; leaving it all on credit does not
            $receipt = null;
            if ($paying > 0) {
                $shift = $this->operableShift($user);
                $receipt = Receipt::create([
                    'invoice_id' => $invoice->id,
                    'cash_shift_id' => $shift->id,
                    'total' => $paying,
                    'created_by' => $user->id,
                ]);
                $receipt->update(['number' => Receipt::formatNumber($receipt->id)]);

                foreach ($lines as $i => $line) {
                    $receipt->payments()->create($this->paymentRow($line, "payments.{$i}"));
                }
            }

            $invoice->paid_amount += $paying;
            $invoice->status = $invoice->paid_amount >= $invoice->total ? 'pagada' : 'pendiente';
            $invoice->save();

            return $receipt;
        });
    }

    private function operableShift(User $user): CashShift
    {
        $shift = CashShift::current();

        if ($shift === null) {
            throw ValidationException::withMessages(['shift' => 'Abre un turno de caja para cobrar.']);
        }

        if ($shift->opened_by !== $user->id && ! $user->hasRole('administrador')) {
            throw ValidationException::withMessages([
                'shift' => "La caja está abierta por {$shift->opener->name}. Solo esa persona puede cobrar en este turno.",
            ]);
        }

        return $shift;
    }

    /** @param  array{due_date: string, note?: string|null}|null  $credit */
    private function applyCredit(Invoice $invoice, ?array $credit): void
    {
        $due = $credit['due_date'] ?? null;

        // A later installment keeps the due date the credit already has,
        // even when it is past (the invoice stays overdue)
        if ($invoice->credit_due_date !== null
            && ($due === null || $due === '' || Carbon::parse($due)->isSameDay($invoice->credit_due_date))) {
            return;
        }

        if ($due === null || $due === '') {
            throw ValidationException::withMessages([
                'credit.due_date' => 'Para dejar un balance a crédito indica la fecha compromiso de pago.',
            ]);
        }

        if (Carbon::parse($due)->lt(today())) {
            throw ValidationException::withMessages(['credit.due_date' => 'La fecha compromiso no puede ser anterior a hoy.']);
        }

        $invoice->credit_due_date = Carbon::parse($due);
        $invoice->credit_note = $credit['note'] ?? null;
    }

    /**
     * @param  array{method: string, amount: int, cash_received?: int|null, reference?: string|null}  $line
     * @return array<string, mixed>
     */
    private function paymentRow(array $line, string $key): array
    {
        $amount = (int) $line['amount'];
        $reference = trim((string) ($line['reference'] ?? ''));

        if ($line['method'] === 'efectivo') {
            $received = (int) ($line['cash_received'] ?? $amount);
            if ($received < $amount) {
                throw ValidationException::withMessages([
                    "{$key}.cash_received" => 'El efectivo recibido es menor que el monto a pagar.',
                ]);
            }

            return [
                'method' => 'efectivo',
                'amount' => $amount,
                'cash_received' => $received,
                'change_given' => $received - $amount,
            ];
        }

        if ($line['method'] === 'transferencia' && $reference === '') {
            throw ValidationException::withMessages([
                "{$key}.reference" => 'Indica el número de la transferencia.',
            ]);
        }

        return [
            'method' => $line['method'],
            'amount' => $amount,
            'reference' => $reference !== '' ? $reference : null,
        ];
    }
}
