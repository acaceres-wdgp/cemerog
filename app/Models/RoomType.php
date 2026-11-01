<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Privada, Semiprivada, Suite… with its price per day.
 *
 * @property int $id
 * @property string $name
 * @property int $daily_price centavos
 */
class RoomType extends Model
{
    protected $fillable = ['name', 'daily_price'];

    protected function casts(): array
    {
        return ['daily_price' => 'integer'];
    }

    /** @return HasMany<Room, $this> */
    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }
}
