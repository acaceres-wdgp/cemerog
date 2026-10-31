<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * A medication or supply of the catalog.
 *
 * @property int $id
 * @property string $code MED-001, INS-001…
 * @property string $name
 * @property string|null $presentation
 * @property string $kind medicamento | insumo
 * @property int $price centavos
 * @property int|null $cost last cost, centavos
 * @property string|null $lot
 * @property Carbon|null $expires_on
 * @property int $stock
 * @property int $min_stock
 * @property bool $is_active
 */
class InventoryItem extends Model
{
    public const KINDS = ['medicamento' => 'MED', 'insumo' => 'INS'];

    /** Who edits the catalog and registers entries */
    public const EDITOR_ROLES = ['administrador', 'almacen'];

    protected $fillable = ['code', 'name', 'presentation', 'kind', 'price', 'cost', 'stock', 'min_stock', 'lot', 'expires_on', 'is_active'];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'cost' => 'integer',
            'expires_on' => 'date',
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

    /** Expires within the next 90 days (or already expired) */
    public function expiresSoon(): bool
    {
        return $this->expires_on !== null && $this->expires_on->lte(today()->addDays(90));
    }

    /**
     * Last cost of every supplier it came from.
     *
     * @return BelongsToMany<Supplier, $this>
     */
    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class)->withPivot(['last_cost', 'last_entry_on'])->withTimestamps();
    }
}
