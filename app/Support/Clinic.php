<?php

namespace App\Support;

/**
 * Clinic data for the header of every printable document.
 */
class Clinic
{
    /**
     * @return array{name: string|null, rnc: string|null, phone: string|null, address: string|null}
     */
    public static function info(): array
    {
        return [
            'name' => config('cemerog.clinic.name'),
            'rnc' => config('cemerog.clinic.rnc'),
            'phone' => config('cemerog.clinic.phone'),
            'address' => config('cemerog.clinic.address'),
        ];
    }
}
