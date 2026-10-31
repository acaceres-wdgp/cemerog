<?php

namespace App\Actions\Caja;

use App\Models\CashShift;
use App\Models\CashWithdrawal;
use App\Models\User;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecordCashWithdrawal
{
    public function __construct(
        private readonly CashShiftSummary $summary,
    ) {}

    /** Take cash out of the open register (bank deposit, petty expense). */
    public function handle(CashShift $shift, User $user, int $amount, string $reason): CashWithdrawal
    {
        return DB::transaction(function () use ($shift, $user, $amount, $reason): CashWithdrawal {
            $shift = CashShift::whereKey($shift->id)->lockForUpdate()->firstOrFail();

            if (! $shift->isOpen()) {
                throw ValidationException::withMessages(['shift' => 'El turno de caja ya está cerrado.']);
            }

            $available = $this->summary->handle($shift)['expected_cash'];
            if ($amount > $available) {
                throw ValidationException::withMessages([
                    'amount' => 'No hay suficiente efectivo en caja. Disponible: '.Money::format($available).'.',
                ]);
            }

            return $shift->withdrawals()->create([
                'amount' => $amount,
                'reason' => $reason,
                'created_by' => $user->id,
            ]);
        });
    }
}
