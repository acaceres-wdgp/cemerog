<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property bool $is_active
 * @property int $position
 */
class OperatingRoom extends Model
{
    protected $fillable = ['name', 'is_active', 'position'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @param Builder<OperatingRoom> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true)->orderBy('position')->orderBy('id');
    }
}
