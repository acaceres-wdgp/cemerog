<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $stock_entry_id
 * @property int $inventory_item_id
 * @property int $quantity
 * @property string|null $lot
 * @property Carbon|null $expires_on
 * @property int $unit_cost
 * @property int $subtotal
 */
class StockEntryLine extends Model
{
    protected $fillable = ['stock_entry_id', 'inventory_item_id', 'quantity', 'lot', 'expires_on', 'unit_cost', 'subtotal'];

    protected function casts(): array
    {
        return ['expires_on' => 'date', 'quantity' => 'integer', 'unit_cost' => 'integer', 'subtotal' => 'integer'];
    }
}
