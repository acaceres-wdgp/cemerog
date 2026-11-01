<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An analysis of the laboratory catalog.
 *
 * @property int $id
 * @property string $code
 * @property string $name
 * @property string $category
 * @property string|null $preparation
 * @property int $price centavos
 * @property bool $is_active
 * @property-read Collection<int, LabTestParameter> $parameters
 */
class LabTest extends Model
{
    protected $fillable = ['code', 'name', 'category', 'preparation', 'price', 'is_active'];

    protected function casts(): array
    {
        return ['price' => 'integer', 'is_active' => 'boolean'];
    }

    /** @return HasMany<LabTestParameter, $this> */
    public function parameters(): HasMany
    {
        return $this->hasMany(LabTestParameter::class)->orderBy('position');
    }
}
