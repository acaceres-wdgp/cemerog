<?php

namespace App\Rules;

use App\Models\Patient;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates uniqueness of a document number against its HMAC-SHA256 hash,
 * since the document_number column stores an encrypted (non-comparable) value.
 */
class UniqueDocumentNumber implements ValidationRule
{
    public function __construct(private readonly ?int $ignoreId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $hash = hash_hmac('sha256', (string) $value, config('app.key'));

        $exists = Patient::where('document_number_hash', $hash)
            ->when($this->ignoreId, fn ($q) => $q->where('id', '!=', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail('Este número de documento ya está registrado.');
        }
    }
}
