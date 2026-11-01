<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $room_id
 * @property string $name
 * @property string $status libre | ocupada | limpieza
 * @property Carbon|null $cleaning_since
 * @property-read Room $room
 * @property-read Admission|null $admission the patient in the bed
 */
class Bed extends Model
{
    public const STATUSES = ['libre', 'ocupada', 'limpieza'];

    protected $fillable = ['room_id', 'name', 'status', 'cleaning_since'];

    protected function casts(): array
    {
        return ['cleaning_since' => 'datetime'];
    }

    /** @return BelongsTo<Room, $this> */
    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    /** @return HasOne<Admission, $this> */
    public function admission(): HasOne
    {
        return $this->hasOne(Admission::class)->where('status', 'internado');
    }

    /** @return HasMany<AdmissionStay, $this> */
    public function stays(): HasMany
    {
        return $this->hasMany(AdmissionStay::class);
    }

    /** «Hab. 2 · Cama A» */
    public function label(): string
    {
        return "{$this->room->name} · {$this->name}";
    }
}
