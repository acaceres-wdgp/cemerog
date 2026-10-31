<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Cash taken out of the register during a shift (bank deposit, petty expense).
 *
 * @property int $id
 * @property int $cash_shift_id
 * @property int $amount
 * @property string $reason
 * @property int $created_by
 * @property Carbon|null $created_at
 * @property-read CashShift $shift
 * @property-read User $creator
 */
class CashWithdrawal extends Model
{
    protected $fillable = ['cash_shift_id', 'amount', 'reason', 'created_by'];

    protected function casts(): array
    {
        return ['amount' => 'integer'];
    }

    /** @return BelongsTo<CashShift, $this> */
    public function shift(): BelongsTo
    {
        return $this->belongsTo(CashShift::class, 'cash_shift_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
