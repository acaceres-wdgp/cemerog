<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A cash register shift. The clinic has a single register, so at most one
 * shift is open at a time (enforced by the unique `open_lock` column).
 *
 * @property int $id
 * @property int $opened_by
 * @property Carbon $opened_at
 * @property int $opening_amount
 * @property array<string, int>|null $opening_denominations
 * @property string $status abierto | cerrado
 * @property bool|null $open_lock
 * @property int|null $closed_by
 * @property Carbon|null $closed_at
 * @property int|null $expected_cash
 * @property int|null $counted_cash
 * @property array<string, int>|null $counted_denominations
 * @property int|null $difference
 * @property string|null $close_note
 * @property-read User $opener
 * @property-read User|null $closer
 * @property-read Collection<int, CashWithdrawal> $withdrawals
 * @property-read Collection<int, Receipt> $receipts
 */
class CashShift extends Model
{
    protected $fillable = [
        'opened_by',
        'opened_at',
        'opening_amount',
        'opening_denominations',
        'status',
        'open_lock',
        'closed_by',
        'closed_at',
        'expected_cash',
        'counted_cash',
        'counted_denominations',
        'difference',
        'close_note',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_amount' => 'integer',
            'opening_denominations' => 'array',
            'open_lock' => 'boolean',
            'expected_cash' => 'integer',
            'counted_cash' => 'integer',
            'counted_denominations' => 'array',
            'difference' => 'integer',
        ];
    }

    /** The shift currently open, if any. */
    public static function current(): ?self
    {
        return self::query()->open()->first();
    }

    /** @param Builder<self> $query */
    public function scopeOpen(Builder $query): void
    {
        $query->where('status', 'abierto');
    }

    public function isOpen(): bool
    {
        return $this->status === 'abierto';
    }

    /** An open shift that started before today was not closed at the end of its day. */
    public function isPendingClose(): bool
    {
        return $this->isOpen() && $this->opened_at->lt(today());
    }

    /** @return BelongsTo<User, $this> */
    public function opener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    /** @return BelongsTo<User, $this> */
    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /** @return HasMany<CashWithdrawal, $this> */
    public function withdrawals(): HasMany
    {
        return $this->hasMany(CashWithdrawal::class);
    }

    /** @return HasMany<Receipt, $this> */
    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }
}
