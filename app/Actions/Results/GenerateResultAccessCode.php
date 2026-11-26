<?php

namespace App\Actions\Results;

use App\Models\Account;
use App\Models\Invoice;
use App\Models\ResultAccessCode;
use App\Models\User;

/**
 * The results code of an account (atención) with lab or imaging studies.
 * Reuses the account's code while it still works; otherwise creates one.
 * Returns the code and, only when it was just created, its plain text.
 */
class GenerateResultAccessCode
{
    /** Charge types that are results of the portal */
    public const RESULT_TYPES = ['laboratorio', 'imagen'];

    public static function accountHasResults(Account $account): bool
    {
        return $account->charges()->whereIn('type', self::RESULT_TYPES)->exists();
    }

    public function handle(Account $account, User $user, ?Invoice $invoice = null): ?ResultAccessCode
    {
        if (! self::accountHasResults($account)) {
            return null;
        }

        $current = self::currentFor($account);
        if ($current !== null) {
            if ($invoice !== null && $current->invoice_id !== $invoice->id) {
                $current->update(['invoice_id' => $invoice->id]);
            }

            return $current;
        }

        return $this->create($account, $user, $invoice);
    }

    /** The account's code that still works, if any */
    public static function currentFor(Account $account): ?ResultAccessCode
    {
        return ResultAccessCode::where('account_id', $account->id)
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();
    }

    public function create(Account $account, User $user, ?Invoice $invoice = null): ResultAccessCode
    {
        // A collision is practically impossible (31^8), but never reuse a hash
        do {
            $code = ResultCode::random();
            $hash = ResultAccessCode::hashCode($code);
        } while (ResultAccessCode::where('code_hash', $hash)->exists());

        return ResultAccessCode::create([
            'account_id' => $account->id,
            'patient_id' => $account->patient_id,
            'invoice_id' => $invoice?->id,
            'code_hash' => $hash,
            'code_encrypted' => $code,
            'expires_at' => now()->addDays(ResultAccessCode::VALID_DAYS),
            'created_by' => $user->id,
        ]);
    }
}
