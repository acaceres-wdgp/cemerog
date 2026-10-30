<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $consultation_id
 * @property int $turn_id
 * @property int $patient_id
 * @property int $doctor_id
 * @property string|null $general_instructions
 * @property int $created_by
 * @property Carbon $prescribed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Turn $turn
 * @property-read Patient $patient
 * @property-read Doctor $doctor
 * @property-read User $creator
 * @property-read Collection<int, PrescriptionItem> $items
 */
class Prescription extends Model
{
    protected $fillable = [
        'consultation_id',
        'turn_id',
        'patient_id',
        'doctor_id',
        'general_instructions',
        'created_by',
        'prescribed_at',
    ];

    protected function casts(): array
    {
        return [
            'prescribed_at' => 'datetime',
        ];
    }

    /** @return HasMany<PrescriptionItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class)->orderBy('position');
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

    /** @return BelongsTo<Consultation, $this> */
    public function consultation(): BelongsTo
    {
        return $this->belongsTo(Consultation::class);
    }
}
