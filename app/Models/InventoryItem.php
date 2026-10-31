<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A medication or supply of the catalog.
 *
 * @property int $id
 * @property string $code MED-001, INS-001…
 * @property string $name
 * @property string|null $presentation
 * @property string $kind medicamento | insumo
 * @property int $price centavos
 * @property int $stock
 * @property int $min_stock
 * @property bool $is_active
 */
class InventoryItem extends Model
{
    public const KINDS = ['medicamento' => 'MED', 'insumo' => 'INS'];

    protected $fillable = ['code', 'name', 'presentation', 'kind', 'price', 'stock', 'min_stock', 'is_active'];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'stock' => 'integer',
            'min_stock' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** Next code of a kind: MED-001, MED-002… */
    public static function nextCode(string $kind): string
    {
        $prefix = self::KINDS[$kind];
        $last = static::query()->where('code', 'like', $prefix.'-%')->orderByDesc('code')->value('code');
        $n = $last !== null ? ((int) substr($last, strlen($prefix) + 1)) + 1 : 1;

        return sprintf('%s-%03d', $prefix, $n);
    }

    public function isLowStock(): bool
    {
        return $this->stock <= $this->min_stock;
    }
}
