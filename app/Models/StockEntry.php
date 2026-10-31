<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $number ENT-0001
 * @property int $supplier_id
 * @property string|null $invoice_ref
 * @property Carbon $received_on
 * @property int $units
 * @property int $total_cost centavos
 * @property int $created_by
 * @property-read Supplier $supplier
 * @property-read User $creator
 */
class StockEntry extends Model
{
    protected $fillable = ['number', 'supplier_id', 'invoice_ref', 'received_on', 'units', 'total_cost', 'created_by'];

    protected function casts(): array
    {
        return ['received_on' => 'date', 'units' => 'integer', 'total_cost' => 'integer'];
    }

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<StockEntryLine, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(StockEntryLine::class);
    }

    /** Number the next entry will get */
    public static function nextNumber(): string
    {
        return sprintf('ENT-%04d', (int) static::max('id') + 1);
    }
}
