<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $turn_id
 * @property int $patient_id
 * @property int $doctor_id
 * @property string $type recuperado | traslado | defuncion
 * @property string|null $destination
 * @property string|null $reason
 * @property string $discharge_diagnosis
 * @property Carbon $discharged_at
 * @property int $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Turn|null $turn
 * @property-read Emergency|null $emergency
 * @property-read Patient $patient
 * @property-read Doctor $doctor
 * @property-read User $creator
 */
class Discharge extends Model
{
    protected $fillable = [
        'turn_id',
        'emergency_id',
        'patient_id',
        'doctor_id',
        'type',
        'destination',
        'reason',
        'discharge_diagnosis',
        'discharged_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'discharged_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Turn, $this> */
    public function turn(): BelongsTo
    {
        return $this->belongsTo(Turn::class);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
