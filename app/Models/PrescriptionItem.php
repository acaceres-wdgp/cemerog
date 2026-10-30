<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $prescription_id
 * @property int $position
 * @property string $medication
 * @property string|null $route
 * @property string $dose
 * @property string $frequency
 * @property int|null $duration_days
 * @property bool $is_continuous
 * @property int $quantity
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read Prescription $prescription
 */
class PrescriptionItem extends Model
{
    protected $fillable = [
        'prescription_id',
        'position',
        'medication',
        'route',
        'dose',
        'frequency',
        'duration_days',
        'is_continuous',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'is_continuous' => 'boolean',
            'duration_days' => 'integer',
            'quantity' => 'integer',
            'position' => 'integer',
        ];
    }

    /** @return BelongsTo<Prescription, $this> */
    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }
}
