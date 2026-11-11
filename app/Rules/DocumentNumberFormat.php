<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * The shape of a patient's document by its type: the 11 digits of a cédula
 * («000-0000000-0»), or 5 to 20 letters or digits for a passport or a
 * foreign ID. A patient without a document has a generated number.
 */
class DocumentNumberFormat implements ValidationRule
{
    public function __construct(private readonly ?string $type) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $value = (string) $value;

        if ($this->type === 'cedula') {
            if (strlen(preg_replace('/\D/', '', $value) ?? '') !== 11 || preg_match('/[^\d\s-]/', $value)) {
                $fail('La cédula debe tener 11 dígitos (000-0000000-0).');
            }

            return;
        }

        if (in_array($this->type, ['pasaporte', 'cedula_extranjera'], true)) {
            $length = strlen(preg_replace('/[^A-Za-z0-9]/', '', $value) ?? '');
            if ($length < 5 || $length > 20) {
                $fail('El documento debe tener entre 5 y 20 letras o números.');
            }
        }
    }
}
