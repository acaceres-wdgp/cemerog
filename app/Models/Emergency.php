<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * An emergency attention: from the quick admission to the discharge.
 *
 * @property int $id
 * @property string|null $number E-000001
 * @property int $patient_id
 * @property int $doctor_id
 * @property int $account_id
 * @property int $cubicle_id
 * @property int|null $occupied_cubicle_id
 * @property string $reason
 * @property string $status activa | alta
 * @property Carbon $arrived_at
 * @property Carbon|null $discharged_at
 * @property int $created_by
 * @property-read Patient $patient
 * @property-read Doctor $doctor
 * @property-read Account $account
 * @property-read EmergencyCubicle $cubicle
 */
class Emergency extends Model
{
    protected $fillable = [
        'number', 'patient_id', 'doctor_id', 'account_id', 'cubicle_id', 'occupied_cubicle_id',
        'reason', 'status', 'arrived_at', 'discharged_at', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'arrived_at' => 'datetime',
            'discharged_at' => 'datetime',
        ];
    }

    /** @param Builder<Emergency> $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', 'activa');
    }

    /** @return HasMany<EmergencyVital, $this> */
    public function vitals(): HasMany
    {
        return $this->hasMany(EmergencyVital::class);
    }

    /** @return HasMany<EmergencyApplication, $this> */
    public function applications(): HasMany
    {
        return $this->hasMany(EmergencyApplication::class);
    }

    /** @return HasOne<EmergencyVital, $this> */
    public function latestVital(): HasOne
    {
        return $this->hasOne(EmergencyVital::class)->latestOfMany('taken_at');
    }

    public function isActive(): bool
    {
        return $this->status === 'activa';
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class)->withTrashed();
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** @return BelongsTo<EmergencyCubicle, $this> */
    public function cubicle(): BelongsTo
    {
        return $this->belongsTo(EmergencyCubicle::class, 'cubicle_id');
    }
}
