<?php

namespace App\Rules;

use App\Models\Patient;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates uniqueness of a document number against its HMAC-SHA256 hash,
 * since the document_number column stores an encrypted (non-comparable) value.
 * The hash is computed over digits only so that "031-0234567-8" and "03102345678"
 * are treated as the same document number.
 */
class UniqueDocumentNumber implements ValidationRule
{
    public function __construct(private readonly ?int $ignoreId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $raw = (string) $value;
        $digits = preg_replace('/[^\d]/', '', $raw) ?: $raw;
        $hash = hash_hmac('sha256', $digits, config('app.key'));

        $exists = Patient::where('document_number_hash', $hash)
            ->when($this->ignoreId, fn ($q) => $q->where('id', '!=', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail('Este número de documento ya está registrado.');
        }
    }
}
