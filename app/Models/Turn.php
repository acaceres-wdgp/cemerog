<?php

namespace App\Models;

use Database\Factories\TurnFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $patient_id
 * @property int $doctor_id
 * @property-read Discharge|null $discharge
 * @property int|null $appointment_id
 * @property int $turn_number
 * @property int $turn_order
 * @property string $status espera | en_consulta | atendido | no_asistio
 * @property Carbon $arrived_at
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Patient $patient
 * @property-read Doctor $doctor
 * @property-read Appointment|null $appointment
 * @property-read Consultation|null $consultation
 * @property-read Prescription|null $prescription
 */
class Turn extends Model
{
    /** @use HasFactory<TurnFactory> */
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_id',
        'turn_number',
        'turn_order',
        'status',
        'arrived_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'turn_number' => 'integer',
            'turn_order' => 'integer',
            'arrived_at' => 'datetime',
        ];
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

    /** @return BelongsTo<Appointment, $this> */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /** @return HasOne<Discharge, $this> */
    public function discharge(): HasOne
    {
        return $this->hasOne(Discharge::class);
    }

    /** @return HasOne<Consultation, $this> */
    public function consultation(): HasOne
    {
        return $this->hasOne(Consultation::class);
    }

    /** @return HasOne<Prescription, $this> */
    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }

    /**
     * Returns true when the turn is from today AND in an open status (espera or en_consulta).
     * Used by ConsultaController::alta() and StoreConsultationRequest.
     */
    public function isOpenToday(): bool
    {
        return $this->arrived_at->isToday()
            && in_array($this->status, ['espera', 'en_consulta'], true);
    }

    /**
     * Return a human-readable label for the given turn status.
     *
     * Known states: espera | en_consulta | atendido | no_asistio
     */
    public static function statusLabel(string $status): string
    {
        return match ($status) {
            'espera' => 'En espera',
            'en_consulta' => 'En consulta',
            'atendido' => 'Atendido',
            'no_asistio' => 'No asistió',
            default => $status,
        };
    }
}
