<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** A supplier's RNC: 9 digits, or the 11 of a cédula for a person */
class Rnc implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $digits = strlen(preg_replace('/\D/', '', (string) $value) ?? '');

        if (($digits !== 9 && $digits !== 11) || preg_match('/[^\d\s-]/', (string) $value)) {
            $fail('El RNC debe tener 9 dígitos, u 11 si es una cédula.');
        }
    }
}
