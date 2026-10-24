<?php

namespace App\Models;

use Database\Factories\ConsultationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $patient_id
 * @property int $doctor_id
 * @property int|null $turn_id
 * @property int|null $peso
 * @property int|null $talla
 * @property int|null $temp
 * @property string|null $presion_arterial
 * @property int|null $frecuencia_cardiaca
 * @property int|null $frecuencia_respiratoria
 * @property int|null $saturacion_o2
 * @property int|null $glucemia
 * @property string|null $motivo_consulta
 * @property string|null $historia_enfermedad
 * @property string|null $examen_fisico
 * @property array|null $diagnosticos
 * @property string|null $plan_tratamiento
 * @property Carbon $consulted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Patient $patient
 * @property-read Doctor $doctor
 * @property-read Turn|null $turn
 */
class Consultation extends Model
{
    /** @use HasFactory<ConsultationFactory> */
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'turn_id',
        'peso',
        'talla',
        'temp',
        'presion_arterial',
        'frecuencia_cardiaca',
        'frecuencia_respiratoria',
        'saturacion_o2',
        'glucemia',
        'motivo_consulta',
        'historia_enfermedad',
        'examen_fisico',
        'diagnosticos',
        'plan_tratamiento',
        'consulted_at',
    ];

    protected function casts(): array
    {
        return [
            'diagnosticos' => 'array',
            'consulted_at' => 'datetime',
            'peso' => 'integer',
            'talla' => 'integer',
            'temp' => 'integer',
            'frecuencia_cardiaca' => 'integer',
            'frecuencia_respiratoria' => 'integer',
            'saturacion_o2' => 'integer',
            'glucemia' => 'integer',
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

    /** @return BelongsTo<Turn, $this> */
    public function turn(): BelongsTo
    {
        return $this->belongsTo(Turn::class);
    }
}
