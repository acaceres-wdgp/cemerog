<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Physical count, waste or expired goods.
 *
 * @property int $id
 * @property int $inventory_item_id
 * @property int $stock_before
 * @property int $quantity signed difference
 * @property string $reason conteo | merma | vencido
 * @property string|null $note
 * @property int $created_by
 */
class InventoryAdjustment extends Model
{
    public const REASONS = ['conteo' => 'Conteo físico', 'merma' => 'Merma o daño', 'vencido' => 'Vencido'];

    protected $fillable = ['inventory_item_id', 'stock_before', 'quantity', 'reason', 'note', 'created_by'];

    protected function casts(): array
    {
        return ['stock_before' => 'integer', 'quantity' => 'integer'];
    }
}
