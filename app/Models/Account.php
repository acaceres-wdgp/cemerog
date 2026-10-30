<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $patient_id
 * @property string $service_date
 * @property string $status
 * @property Carbon $opened_at
 * @property Carbon|null $closed_at
 * @property-read Patient $patient
 * @property-read Collection<int, AccountCharge> $charges
 */
class Account extends Model
{
    protected $fillable = [
        'patient_id',
        'service_date',
        'status',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'service_date' => 'date',
    ];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /** @return HasMany<AccountCharge, $this> */
    public function charges(): HasMany
    {
        return $this->hasMany(AccountCharge::class);
    }
}
