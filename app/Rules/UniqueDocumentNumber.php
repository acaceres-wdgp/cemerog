<?php

namespace App\Rules;

use App\Models\Patient;
use App\Support\Pii;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates uniqueness of a document number against its HMAC-SHA256 hash,
 * since the document_number column stores an encrypted (non-comparable) value.
 *
 * The hash is computed via Pii::documentHash, which normalises by document type:
 *   - cedula:             digits only
 *   - pasaporte / cedula_extranjera: uppercase [A-Z0-9]
 *   - no_tiene:           uppercase [A-Z0-9]
 */
class UniqueDocumentNumber implements ValidationRule
{
    public function __construct(
        private readonly ?int $ignoreId = null,
        private readonly string $type = 'cedula',
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $raw = (string) $value;
        $hash = Pii::documentHash($this->type, $raw);

        $exists = Patient::where('document_number_hash', $hash)
            ->when($this->ignoreId, fn ($q) => $q->where('id', '!=', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail('Este número de documento ya está registrado.');
        }
    }
}
