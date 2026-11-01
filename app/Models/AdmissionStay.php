<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A bed occupied during an admission, with the price per day of that moment.
 *
 * @property int $id
 * @property int $admission_id
 * @property int $bed_id
 * @property string $bed_label
 * @property string $room_type
 * @property int $daily_price centavos
 * @property Carbon $started_at
 * @property Carbon|null $ended_at
 * @property string|null $reason
 * @property int $created_by
 * @property-read Bed $bed
 */
class AdmissionStay extends Model
{
    protected $fillable = ['admission_id', 'bed_id', 'bed_label', 'room_type', 'daily_price', 'started_at', 'ended_at', 'reason', 'created_by'];

    protected function casts(): array
    {
        return [
            'daily_price' => 'integer',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Bed, $this> */
    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }
}
