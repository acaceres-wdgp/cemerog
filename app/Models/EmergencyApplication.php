<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A medication or supply applied to a patient in emergency.
 *
 * @property int $id
 * @property int $emergency_id
 * @property string $kind medicamento | insumo
 * @property int|null $inventory_item_id
 * @property string $description
 * @property int $quantity
 * @property string|null $route
 * @property int $unit_price
 * @property int $total
 * @property bool $brought_by_patient
 * @property int|null $stock_left
 * @property Carbon $applied_at
 * @property int $applied_by
 * @property-read User $applier
 */
class EmergencyApplication extends Model
{
    protected $fillable = [
        'emergency_id', 'kind', 'inventory_item_id', 'description', 'quantity', 'route',
        'unit_price', 'total', 'brought_by_patient', 'stock_left', 'applied_at', 'applied_by',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'integer',
            'total' => 'integer',
            'brought_by_patient' => 'boolean',
            'stock_left' => 'integer',
            'applied_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function applier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applied_by');
    }
}
