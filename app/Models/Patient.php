<?php

namespace App\Models;

use Database\Factories\PatientFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $document_type
 * @property string $document_number Decrypted on read; encrypted on write.
 * @property string $document_number_hash HMAC-SHA256 of digits-only document number.
 * @property string|null $email Decrypted on read; encrypted on write.
 * @property string $first_names
 * @property string $last_names
 * @property Carbon $birth_date
 * @property string $sex
 * @property string|null $phone Decrypted on read; encrypted on write.
 * @property string|null $phone_hash HMAC-SHA256 of digits-only phone number.
 * @property string|null $address
 * @property string|null $blood_type
 * @property string|null $allergies
 * @property string|null $emergency_contact_name
 * @property string|null $emergency_contact_phone
 * @property string|null $photo_path Path relative to the public disk.
 * @property-read string|null $photo_url Public URL for the photo, or null.
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
    'photo_path',
])]
class Patient extends Model
{
    /** @use HasFactory<PatientFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'email' => 'encrypted',
            'phone' => 'encrypted',
        ];
    }

    /**
     * Encrypt document_number on write and compute its HMAC-SHA256 hash
     * over digits only (normalised) for the unique index and exact-match searches.
     * Decrypt transparently on read.
     */
    /** @return Attribute<string, string> */
    protected function documentNumber(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => decrypt($value),
            set: function (string $value) {
                $digits = preg_replace('/[^\d]/', '', $value) ?: $value;

                return [
                    'document_number' => encrypt($value),
                    'document_number_hash' => hash_hmac('sha256', $digits, config('app.key')),
                ];
            },
        );
    }

    /**
     * Encrypt phone on write and compute its HMAC-SHA256 hash over digits only
     * for exact-match searches (phone is also encrypted, so LIKE is impossible).
     * Decrypt transparently on read.
     */
    /** @return Attribute<string|null, string|null> */
    protected function phone(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? decrypt($value) : null,
            set: function (?string $value) {
                if ($value === null || $value === '') {
                    return ['phone' => null, 'phone_hash' => null];
                }
                $digits = preg_replace('/[^\d]/', '', $value);

                return [
                    'phone' => encrypt($value),
                    'phone_hash' => $digits ? hash_hmac('sha256', $digits, config('app.key')) : null,
                ];
            },
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

    /**
     * Formatted expedition number: P-00001, P-00042, P-100000.
     */
    public function getExpedienteNumberAttribute(): string
    {
        return 'P-'.str_pad((string) $this->id, 5, '0', STR_PAD_LEFT);
    }

    /** @return HasOne<PatientAntecedent, $this> */
    public function antecedent(): HasOne
    {
        return $this->hasOne(PatientAntecedent::class);
    }

    /** @return HasMany<Turn, $this> */
    public function turns(): HasMany
    {
        return $this->hasMany(Turn::class);
    }
}
