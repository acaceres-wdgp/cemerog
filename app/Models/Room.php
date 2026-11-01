<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name Hab. 1
 * @property int $room_type_id
 * @property int $position
 * @property-read RoomType $type
 * @property-read Collection<int, Bed> $beds
 */
class Room extends Model
{
    protected $fillable = ['name', 'room_type_id', 'position'];

    /** @return BelongsTo<RoomType, $this> */
    public function type(): BelongsTo
    {
        return $this->belongsTo(RoomType::class, 'room_type_id');
    }

    /** @return HasMany<Bed, $this> */
    public function beds(): HasMany
    {
        return $this->hasMany(Bed::class)->orderBy('name');
    }

    /** One bed is «Cama única»; with more they are Cama A, B, C… */
    public function renameBeds(): void
    {
        $beds = $this->beds()->get();
        if ($beds->count() === 1) {
            $beds->first()?->update(['name' => 'Cama única']);

            return;
        }
        // Two passes so the unique (room, name) never collides
        foreach ($beds as $i => $bed) {
            $bed->update(['name' => "tmp-{$bed->id}"]);
        }
        foreach ($beds->values() as $i => $bed) {
            $bed->update(['name' => 'Cama '.chr(65 + $i)]);
        }
    }
}
