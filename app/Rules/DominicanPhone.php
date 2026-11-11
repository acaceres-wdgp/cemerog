<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A complete Dominican phone: 10 digits with area code 809, 829 or 849.
 * The separators of the mask («(809) 555-1234») are ignored.
 */
class DominicanPhone implements ValidationRule
{
    public const AREA_CODES = ['809', '829', '849'];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $digits = preg_replace('/\D/', '', (string) $value) ?? '';

        if (strlen($digits) !== 10 || ! in_array(substr($digits, 0, 3), self::AREA_CODES, true)) {
            $fail('El teléfono debe tener 10 dígitos y empezar por 809, 829 u 849.');
        }
    }
}
