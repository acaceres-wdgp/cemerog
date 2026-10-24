<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $patient_id
 * @property string|null $personales
 * @property string|null $quirurgicos
 * @property string|null $medicamentos
 * @property string|null $familiares
 * @property string|null $alergias
 * @property-read Patient $patient
 */
class PatientAntecedent extends Model
{
    protected $fillable = [
        'patient_id',
        'personales',
        'quirurgicos',
        'medicamentos',
        'familiares',
        'alergias',
    ];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }
}
