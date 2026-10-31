<?php

namespace App\Actions\Caja;

use App\Models\CashShift;
use App\Models\Payment;

/**
 * Money that went through a shift, in centavos.
 *
 * Only cash stays in the drawer: expected cash = opening float + cash income
 * − withdrawals. Card and transfer income are reported apart because they
 * never enter the drawer.
 */
class CashShiftSummary
{
    /**
     * @return array{opening: int, income: array{efectivo: int, tarjeta: int, transferencia: int}, withdrawals: int, expected_cash: int}
     */
    public function handle(CashShift $shift): array
    {
        $income = $this->incomeByMethod($shift);
        $withdrawals = (int) $shift->withdrawals()->sum('amount');

        return [
            'opening' => $shift->opening_amount,
            'income' => $income,
            'withdrawals' => $withdrawals,
            'expected_cash' => $shift->opening_amount + $income['efectivo'] - $withdrawals,
        ];
    }

    /**
     * Income of the shift by payment method, from its receipts that were not
     * voided. Cash counts the amount applied to the invoice, not the bills
     * received: the change went back to the patient.
     *
     * @return array{efectivo: int, tarjeta: int, transferencia: int}
     */
    protected function incomeByMethod(CashShift $shift): array
    {
        $totals = Payment::query()
            ->whereHas('receipt', fn ($q) => $q->where('cash_shift_id', $shift->id)->whereNull('voided_at'))
            ->selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->pluck('total', 'method');

        return [
            'efectivo' => (int) ($totals['efectivo'] ?? 0),
            'tarjeta' => (int) ($totals['tarjeta'] ?? 0),
            'transferencia' => (int) ($totals['transferencia'] ?? 0),
        ];
    }
}
