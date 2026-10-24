<?php

namespace App\Models;

use Database\Factories\PatientFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $document_type
 * @property string $document_number Decrypted on read; encrypted on write.
 * @property string $document_number_hash HMAC-SHA256 of the plaintext document number.
 * @property string|null $email Decrypted on read; encrypted on write.
 * @property string $first_names
 * @property string $last_names
 * @property Carbon $birth_date
 * @property string $sex
 * @property string|null $phone Decrypted on read; encrypted on write.
 * @property string|null $address
 * @property string|null $blood_type
 * @property string|null $allergies
 * @property string|null $emergency_contact_name
 * @property string|null $emergency_contact_phone
 * @property string|null $photo_path Path relative to the public disk.
 * @property-read string|null $photo_url Public URL for the photo, or null.
 * @property bool $is_active
 * @property Carbon|null $deleted_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'document_type',
    'document_number',
    'email',
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
    'photo_path',
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
            'email' => 'encrypted',
            'phone' => 'encrypted',
        ];
    }

    /**
     * Encrypt document_number on write and compute its HMAC-SHA256 hash
     * for the unique index. Decrypt transparently on read.
     */
    /** @return Attribute<string, string> */
    protected function documentNumber(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => decrypt($value),
            set: fn (string $value) => [
                'document_number' => encrypt($value),
                'document_number_hash' => hash_hmac('sha256', $value, config('app.key')),
            ],
        );
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

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo_path
            ? Storage::disk('public')->url($this->photo_path)
            : null;
    }

    /** @return HasOne<PatientAntecedent, $this> */
    public function antecedent(): HasOne
    {
        return $this->hasOne(PatientAntecedent::class);
    }
}
