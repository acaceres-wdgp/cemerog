<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $receipt_id
 * @property string $method efectivo | tarjeta | transferencia
 * @property int $amount
 * @property int|null $cash_received
 * @property int|null $change_given
 * @property string|null $reference
 * @property-read Receipt $receipt
 */
class Payment extends Model
{
    public const METHODS = ['efectivo', 'tarjeta', 'transferencia'];

    protected $fillable = [
        'receipt_id',
        'method',
        'amount',
        'cash_received',
        'change_given',
        'reference',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'cash_received' => 'integer',
            'change_given' => 'integer',
        ];
    }

    /** @return BelongsTo<Receipt, $this> */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }
}
