<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $number L-0001
 * @property int $patient_id
 * @property string $origin consulta | emergencia | internamiento | externo
 * @property int|null $turn_id
 * @property int|null $emergency_id
 * @property int|null $doctor_id
 * @property string|null $external_doctor
 * @property string|null $indication
 * @property string $status ordenada | muestra | ingresado | validada | entregada | cancelada
 * @property Carbon $ordered_at
 * @property Carbon|null $sample_at
 * @property int|null $sample_by
 * @property Carbon|null $validated_at
 * @property int|null $validated_by
 * @property Carbon|null $delivered_at
 * @property Carbon|null $cancelled_at
 * @property int|null $cancelled_by
 * @property string|null $cancel_reason
 * @property int $created_by
 * @property-read Patient $patient
 * @property-read Doctor|null $doctor
 * @property-read Emergency|null $emergency
 * @property-read Collection<int, LabOrderItem> $items
 */
class LabOrder extends Model
{
    public const STATUSES = ['ordenada', 'muestra', 'ingresado', 'validada', 'entregada', 'cancelada'];

    protected $fillable = [
        'number', 'patient_id', 'origin', 'turn_id', 'emergency_id', 'doctor_id', 'external_doctor', 'indication',
        'status', 'ordered_at', 'sample_at', 'sample_by', 'validated_at', 'validated_by', 'delivered_at',
        'cancelled_at', 'cancelled_by', 'cancel_reason', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'ordered_at' => 'datetime',
            'sample_at' => 'datetime',
            'validated_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
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

    /** @return BelongsTo<Emergency, $this> */
    public function emergency(): BelongsTo
    {
        return $this->belongsTo(Emergency::class);
    }

    /** @return BelongsTo<Turn, $this> */
    public function turn(): BelongsTo
    {
        return $this->belongsTo(Turn::class);
    }

    /** @return HasMany<LabOrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(LabOrderItem::class);
    }
}
