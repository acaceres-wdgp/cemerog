<?php

namespace App\Models;

use Database\Factories\PatientFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $document_type
 * @property string $document_number
 * @property string $first_names
 * @property string $last_names
 * @property Carbon $birth_date
 * @property string $sex
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $blood_type
 * @property string|null $allergies
 * @property string|null $emergency_contact_name
 * @property string|null $emergency_contact_phone
 * @property bool $is_active
 * @property Carbon|null $deleted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'document_type',
    'document_number',
    'first_names',
    'last_names',
    'birth_date',
    'sex',
    'phone',
    'address',
    'blood_type',
    'allergies',
    'emergency_contact_name',
    'emergency_contact_phone',
    'is_active',
])]
class Patient extends Model
{
    /** @use HasFactory<PatientFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_names} {$this->last_names}";
    }

    public function getInitialsAttribute(): string
    {
        $first = mb_strtoupper(mb_substr($this->first_names, 0, 1));
        $last = mb_strtoupper(mb_substr($this->last_names, 0, 1));

        return "{$first}{$last}";
    }

    public function getAgeAttribute(): int
    {
        return $this->birth_date->age;
    }
}
