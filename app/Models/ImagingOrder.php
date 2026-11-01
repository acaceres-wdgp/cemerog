<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * An imaging study ordered for a patient, with its report.
 *
 * @property int $id
 * @property string|null $number I-0001
 * @property int $patient_id
 * @property int $imaging_study_id
 * @property string $name
 * @property string $modality
 * @property int $price centavos, at the time of the order
 * @property string $origin consulta | emergencia | internamiento | externo
 * @property int|null $turn_id
 * @property int|null $emergency_id
 * @property int|null $doctor_id
 * @property string|null $external_doctor
 * @property string|null $indication
 * @property string $status ordenada | realizado | borrador | listo | entregado | cancelada
 * @property Carbon $ordered_at
 * @property Carbon|null $performed_at
 * @property int|null $performed_by
 * @property int|null $account_charge_id
 * @property string|null $findings
 * @property string|null $conclusion
 * @property Carbon|null $signed_at
 * @property int|null $signed_by
 * @property Carbon|null $delivered_at
 * @property Carbon|null $cancelled_at
 * @property int|null $cancelled_by
 * @property string|null $cancel_reason
 * @property int $created_by
 * @property-read Patient $patient
 * @property-read Doctor|null $doctor
 * @property-read User|null $signer
 */
class ImagingOrder extends Model
{
    public const STATUSES = ['ordenada', 'realizado', 'borrador', 'listo', 'entregado', 'cancelada'];

    protected $fillable = [
        'number', 'patient_id', 'imaging_study_id', 'name', 'modality', 'price', 'origin', 'turn_id',
        'emergency_id', 'doctor_id', 'external_doctor', 'indication', 'status', 'ordered_at', 'performed_at',
        'performed_by', 'account_charge_id', 'findings', 'conclusion', 'signed_at', 'signed_by', 'delivered_at',
        'cancelled_at', 'cancelled_by', 'cancel_reason', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'ordered_at' => 'datetime',
            'performed_at' => 'datetime',
            'signed_at' => 'datetime',
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

    /** @return BelongsTo<User, $this> */
    public function signer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'signed_by');
    }
}
