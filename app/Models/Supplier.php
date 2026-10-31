<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A supplier of medications and supplies. There are no payables yet; the
 * entity is the base for them.
 *
 * @property int $id
 * @property string $name
 * @property string|null $rnc
 * @property string|null $phone
 * @property string|null $contact
 * @property bool $is_active
 */
class Supplier extends Model
{
    protected $fillable = ['name', 'rnc', 'phone', 'contact', 'is_active'];

    /** @return HasMany<StockEntry, $this> */
    public function entries(): HasMany
    {
        return $this->hasMany(StockEntry::class);
    }

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
