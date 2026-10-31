<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Proof of a payment on an invoice, taken in a cash register shift. It can
 * combine several methods (cash, card, transfer).
 *
 * @property int $id
 * @property string|null $number R-0001
 * @property int $invoice_id
 * @property int $cash_shift_id
 * @property int $total
 * @property int $created_by
 * @property int|null $voided_by
 * @property Carbon|null $voided_at
 * @property string|null $void_reason
 * @property Carbon|null $created_at
 * @property-read Invoice $invoice
 * @property-read CashShift $shift
 * @property-read User $creator
 * @property-read User|null $voider
 * @property-read Collection<int, Payment> $payments
 */
class Receipt extends Model
{
    protected $fillable = [
        'number',
        'invoice_id',
        'cash_shift_id',
        'total',
        'created_by',
        'voided_by',
        'voided_at',
        'void_reason',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'integer',
            'voided_at' => 'datetime',
        ];
    }

    public static function formatNumber(int $id): string
    {
        return 'R-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    /** @param Builder<self> $query */
    public function scopeValid(Builder $query): void
    {
        $query->whereNull('voided_at');
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
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

    /** @return BelongsTo<User, $this> */
    public function voider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
