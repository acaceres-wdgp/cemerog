<?php

namespace App\Actions\Caja;

use App\Models\CashShift;
use App\Models\User;
use App\Support\CashDenominations;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\ValidationException;

class OpenCashShift
{
    /**
     * Open the single cash register with an opening float, given either as a
     * total or as a count by denomination (then the total is the count).
     *
     * @param  array<int|string, int|string|null>|null  $denominations
     */
    public function handle(User $user, int $amount, ?array $denominations = null): CashShift
    {
        $counts = $denominations !== null ? CashDenominations::normalize($denominations) : null;
        if ($counts !== null) {
            $amount = CashDenominations::total($counts);
        }

        $open = CashShift::current();
        if ($open !== null) {
            throw $this->alreadyOpen($open);
        }

        try {
            return CashShift::create([
                'opened_by' => $user->id,
                'opened_at' => now(),
                'opening_amount' => $amount,
                'opening_denominations' => $counts ?: null,
                'status' => 'abierto',
                'open_lock' => true,
            ]);
        } catch (UniqueConstraintViolationException) {
            // Someone opened the register between the check and the insert
            throw $this->alreadyOpen(CashShift::current());
        }
    }

    private function alreadyOpen(?CashShift $open): ValidationException
    {
        $who = $open?->opener->name;

        return ValidationException::withMessages([
            'shift' => $who !== null
                ? "La caja ya está abierta por {$who}. Debe cerrarse antes de abrir otro turno."
                : 'La caja ya está abierta.',
        ]);
    }
}
