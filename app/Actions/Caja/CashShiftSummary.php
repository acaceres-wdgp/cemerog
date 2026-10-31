<?php

namespace App\Actions\Caja;

use App\Models\CashShift;

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
     * Income of the shift by payment method. Payments arrive with the billing
     * module; until then a shift has no income.
     *
     * @return array{efectivo: int, tarjeta: int, transferencia: int}
     */
    protected function incomeByMethod(CashShift $shift): array
    {
        return ['efectivo' => 0, 'tarjeta' => 0, 'transferencia' => 0];
    }
}
