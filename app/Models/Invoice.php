<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * An issued invoice: the charges of a daily account, with an optional
 * discount. Once issued it never changes; a mistake is fixed by voiding it.
 *
 * @property int $id
 * @property string|null $number F-0000001
 * @property int $account_id
 * @property int $patient_id
 * @property string $status pendiente | pagada | anulada
 * @property int $subtotal
 * @property string|null $discount_type porcentaje | monto
 * @property int|null $discount_value percent (porcentaje) or centavos (monto)
 * @property int $discount_amount
 * @property string|null $discount_reason
 * @property int $total
 * @property int $paid_amount
 * @property string|null $ncf
 * @property Carbon|null $credit_due_date
 * @property string|null $credit_note
 * @property int $issued_by
 * @property Carbon $issued_at
 * @property int|null $voided_by
 * @property Carbon|null $voided_at
 * @property string|null $void_reason
 * @property-read Account $account
 * @property-read Patient $patient
 * @property-read User $issuer
 * @property-read User|null $voider
 * @property-read Collection<int, InvoiceLine> $lines
 */
class Invoice extends Model
{
    protected $fillable = [
        'number',
        'account_id',
        'patient_id',
        'status',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount_amount',
        'discount_reason',
        'total',
        'paid_amount',
        'ncf',
        'credit_due_date',
        'credit_note',
        'issued_by',
        'issued_at',
        'voided_by',
        'voided_at',
        'void_reason',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'discount_value' => 'integer',
            'discount_amount' => 'integer',
            'total' => 'integer',
            'paid_amount' => 'integer',
            'credit_due_date' => 'date',
            'issued_at' => 'datetime',
            'voided_at' => 'datetime',
        ];
    }

    public static function formatNumber(int $id): string
    {
        return 'F-'.str_pad((string) $id, 7, '0', STR_PAD_LEFT);
    }

    public function balance(): int
    {
        return $this->status === 'anulada' ? 0 : max(0, $this->total - $this->paid_amount);
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<User, $this> */
    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /** @return BelongsTo<User, $this> */
    public function voider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    /** @return HasMany<InvoiceLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class);
    }
}
