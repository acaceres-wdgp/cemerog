<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $invoice_id
 * @property int|null $account_charge_id
 * @property string $type
 * @property string $description
 * @property int $quantity
 * @property int $unit_price
 * @property int $total
 * @property int|null $doctor_id
 * @property int|null $doctor_fee
 * @property-read Invoice $invoice
 * @property-read Doctor|null $doctor
 */
class InvoiceLine extends Model
{
    protected $fillable = [
        'invoice_id',
        'account_charge_id',
        'type',
        'description',
        'quantity',
        'unit_price',
        'total',
        'doctor_id',
        'doctor_fee',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'integer',
            'total' => 'integer',
            'doctor_fee' => 'integer',
        ];
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }
}
