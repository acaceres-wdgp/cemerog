<?php

namespace App\Models;

use Database\Factories\AppointmentFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $patient_id
 * @property int $doctor_id
 * @property Carbon $appointment_date
 * @property string|null $appointment_time
 * @property string $type
 * @property string $status pendiente | confirmada | cancelada | no_asistio
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Patient $patient
 * @property-read Doctor $doctor
 * @property-read Turn|null $turn
 */
class Appointment extends Model
{
    /** @use HasFactory<AppointmentFactory> */
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_date',
        'appointment_time',
        'type',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
        ];
    }

    /** Normalize TIME column to HH:MM, handling MySQL's HH:MM:SS. */
    protected function appointmentTime(): Attribute
    {
        return Attribute::get(
            fn (?string $value) => $value !== null ? substr($value, 0, 5) : null,
        );
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

    /** @return HasOne<Turn, $this> */
    public function turn(): HasOne
    {
        return $this->hasOne(Turn::class);
    }
}
