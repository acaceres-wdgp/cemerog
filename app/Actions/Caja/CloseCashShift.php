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
     * Close the shift with the cash the cashier counted. The system records
     * the expected cash and the difference; a difference needs an explanation.
     *
     * @param  array<int|string, int|string|null>|null  $denominations
     */
    public function handle(CashShift $shift, User $user, int $counted, ?array $denominations, ?string $note): CashShift
    {
        $counts = $denominations !== null ? CashDenominations::normalize($denominations) : null;
        if ($counts !== null) {
            $counted = CashDenominations::total($counts);
        }

        return DB::transaction(function () use ($shift, $user, $counted, $counts, $note): CashShift {
            $shift = CashShift::whereKey($shift->id)->lockForUpdate()->firstOrFail();

            if (! $shift->isOpen()) {
                throw ValidationException::withMessages(['shift' => 'El turno de caja ya está cerrado.']);
            }

            $expected = $this->summary->handle($shift)['expected_cash'];
            $difference = $counted - $expected;
            $note = $note !== null ? trim($note) : null;

            if ($difference !== 0 && ($note === null || $note === '')) {
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
                'difference' => $difference,
                'close_note' => $note ?: null,
            ]);

            return $shift;
        });
    }
}
