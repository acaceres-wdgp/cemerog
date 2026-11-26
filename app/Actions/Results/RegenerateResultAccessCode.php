<?php

namespace App\Actions\Results;

use App\Models\Account;
use App\Models\ResultAccessCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Revokes the account's working codes and creates a new one (lost code) */
class RegenerateResultAccessCode
{
    public function __construct(private GenerateResultAccessCode $generate) {}

    public function handle(Account $account, User $user): ResultAccessCode
    {
        return DB::transaction(function () use ($account, $user): ResultAccessCode {
            $previous = ResultAccessCode::where('account_id', $account->id)
                ->whereNull('revoked_at')
                ->latest('id')
                ->first();
            ResultAccessCode::where('account_id', $account->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            return $this->generate->create($account, $user, $previous?->invoice);
        });
    }
}
