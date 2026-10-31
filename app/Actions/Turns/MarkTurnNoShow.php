<?php

namespace App\Actions\Turns;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Models\AccountCharge;
use App\Models\Turn;
use Illuminate\Support\Facades\DB;

class MarkTurnNoShow
{
    public function __construct(
        private readonly CloseDailyAccountIfDone $closeDailyAccount,
    ) {}

    /**
     * Mark a turn as `no_asistio`: the patient is not charged for a consultation
     * that did not happen, and the account of that day closes if nothing else
     * is still open.
     */
    public function handle(Turn $turn): void
    {
        DB::transaction(function () use ($turn): void {
            $turn->update(['status' => 'no_asistio']);

            AccountCharge::where('turn_id', $turn->id)
                ->where('type', 'consulta')
                ->delete();

            $this->closeDailyAccount->handle($turn->patient, $turn->arrived_at);
        });
    }
}
