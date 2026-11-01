<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * A patient admitted to Internamiento.
 *
 * @property int $id
 * @property string|null $number IN-000001
 * @property int $patient_id
 * @property int $account_id open for the whole stay
 * @property int|null $bed_id current bed (null after discharge)
 * @property int $doctor_id médico tratante
 * @property string $origin emergencia | consulta | directo
 * @property int|null $emergency_id
 * @property int|null $turn_id
 * @property string|null $diagnosis_code
 * @property string $diagnosis_label
 * @property string|null $treatment
 * @property string $status internado | alta
 * @property Carbon $admitted_at
 * @property Carbon|null $discharged_at
 * @property int $created_by
 * @property-read Patient $patient
 * @property-read Account $account
 * @property-read Bed|null $bed
 * @property-read Doctor $doctor
 * @property-read Collection<int, AdmissionStay> $stays
 * @property-read Collection<int, AdmissionNote> $notes
 * @property-read Collection<int, EmergencyVital> $vitals
 * @property-read Collection<int, EmergencyApplication> $applications
 */
class Admission extends Model
{
    public const ORIGINS = ['emergencia' => 'Emergencia', 'consulta' => 'Consulta', 'directo' => 'Ingreso directo'];

    protected $fillable = [
        'number', 'patient_id', 'account_id', 'bed_id', 'doctor_id', 'origin', 'emergency_id', 'turn_id',
        'diagnosis_code', 'diagnosis_label', 'treatment', 'status', 'admitted_at', 'discharged_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'admitted_at' => 'datetime',
            'discharged_at' => 'datetime',
        ];
    }

    /** @param Builder<Admission> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'internado');
    }

    public function isActive(): bool
    {
        return $this->status === 'internado';
    }

    /** «Día 3»: the admission day is day 1 */
    public function dayNumber(?CarbonInterface $at = null): int
    {
        $end = ($this->discharged_at ?? $at ?? now())->copy()->startOfDay();

        return (int) $this->admitted_at->copy()->startOfDay()->diffInDays($end) + 1;
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class)->withTrashed();
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** @return BelongsTo<Bed, $this> */
    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /** @return HasMany<AdmissionStay, $this> */
    public function stays(): HasMany
    {
        return $this->hasMany(AdmissionStay::class)->orderBy('started_at')->orderBy('id');
    }

    /** @return HasOne<AdmissionStay, $this> */
    public function currentStay(): HasOne
    {
        return $this->hasOne(AdmissionStay::class)->whereNull('ended_at')->latestOfMany();
    }

    /** @return HasMany<AdmissionNote, $this> */
    public function notes(): HasMany
    {
        return $this->hasMany(AdmissionNote::class)->latest('id');
    }

    /** @return HasMany<EmergencyVital, $this> */
    public function vitals(): HasMany
    {
        return $this->hasMany(EmergencyVital::class)->orderByDesc('taken_at')->orderByDesc('id');
    }

    /** @return HasMany<EmergencyApplication, $this> */
    public function applications(): HasMany
    {
        return $this->hasMany(EmergencyApplication::class)->orderByDesc('applied_at')->orderByDesc('id');
    }
}
