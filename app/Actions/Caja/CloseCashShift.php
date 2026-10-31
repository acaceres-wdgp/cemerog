<?php

namespace App\Actions\Caja;

use App\Models\CashShift;
use App\Models\User;
use App\Support\CashDenominations;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CloseCashShift
{
    public function __construct(
        private readonly CashShiftSummary $summary,
    ) {}

    /**
     * Close the shift with the cash the cashier counted and, optionally, the
     * card and transfer totals checked against the terminal and the bank. The
     * system records the expected cash and the difference; any difference
     * (cash, card or transfer) needs an explanation.
     *
     * @param  array<int|string, int|string|null>|null  $denominations
     */
    public function handle(CashShift $shift, User $user, int $counted, ?array $denominations, ?string $note, ?int $countedCard = null, ?int $countedTransfer = null): CashShift
    {
        $counts = $denominations !== null ? CashDenominations::normalize($denominations) : null;
        if ($counts !== null) {
            $counted = CashDenominations::total($counts);
        }

        return DB::transaction(function () use ($shift, $user, $counted, $counts, $note, $countedCard, $countedTransfer): CashShift {
            $shift = CashShift::whereKey($shift->id)->lockForUpdate()->firstOrFail();

            if (! $shift->isOpen()) {
                throw ValidationException::withMessages(['shift' => 'El turno de caja ya está cerrado.']);
            }

            $summary = $this->summary->handle($shift);
            $expected = $summary['expected_cash'];
            $difference = $counted - $expected;
            $note = $note !== null ? trim($note) : null;
            $otherDifference = ($countedCard !== null && $countedCard !== $summary['income']['tarjeta'])
                || ($countedTransfer !== null && $countedTransfer !== $summary['income']['transferencia']);

            if (($difference !== 0 || $otherDifference) && ($note === null || $note === '')) {
                throw ValidationException::withMessages([
                    'close_note' => 'Explica la diferencia entre lo contado y lo esperado.',
                ]);
            }

            $shift->update([
                'status' => 'cerrado',
                'open_lock' => null,
                'closed_by' => $user->id,
                'closed_at' => now(),
                'expected_cash' => $expected,
                'counted_cash' => $counted,
                'counted_denominations' => $counts ?: null,
                'counted_card' => $countedCard,
                'counted_transfer' => $countedTransfer,
                'difference' => $difference,
                'close_note' => $note ?: null,
            ]);

            return $shift;
        });
    }
}
