<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $number Q-000001
 * @property int $patient_id
 * @property int $surgery_procedure_id
 * @property string $procedure_name
 * @property int $price centavos, at scheduling time
 * @property int $operating_room_id
 * @property int $surgeon_id
 * @property int|null $anesthetist_id
 * @property int|null $admission_id
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property string $status programada | quirofano | realizada | cancelada
 * @property string|null $notes
 * @property Carbon|null $started_at
 * @property Carbon|null $performed_at
 * @property int|null $account_charge_id
 * @property Carbon|null $cancelled_at
 * @property string|null $cancel_reason
 * @property int $created_by
 * @property-read Patient $patient
 * @property-read OperatingRoom $operatingRoom
 * @property-read Doctor $surgeon
 * @property-read Doctor|null $anesthetist
 * @property-read Admission|null $admission
 */
class Surgery extends Model
{
    public const STATUSES = ['programada', 'quirofano', 'realizada', 'cancelada'];

    protected $fillable = [
        'number', 'patient_id', 'surgery_procedure_id', 'procedure_name', 'price', 'operating_room_id', 'surgeon_id',
        'anesthetist_id', 'admission_id', 'starts_at', 'ends_at', 'status', 'notes', 'started_at', 'performed_at',
        'account_charge_id', 'cancelled_at', 'cancelled_by', 'cancel_reason', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'started_at' => 'datetime',
            'performed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Scheduled or in the operating room
     *
     * @param  Builder<Surgery>  $query
     */
    public function scopePending(Builder $query): void
    {
        $query->whereIn('status', ['programada', 'quirofano']);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class)->withTrashed();
    }

    /** @return BelongsTo<OperatingRoom, $this> */
    public function operatingRoom(): BelongsTo
    {
        return $this->belongsTo(OperatingRoom::class);
    }

    /** @return BelongsTo<Doctor, $this> */
    public function surgeon(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'surgeon_id');
    }

    /** @return BelongsTo<Doctor, $this> */
    public function anesthetist(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'anesthetist_id');
    }

    /** @return BelongsTo<Admission, $this> */
    public function admission(): BelongsTo
    {
        return $this->belongsTo(Admission::class);
    }
}
