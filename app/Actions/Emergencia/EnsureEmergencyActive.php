<?php

namespace App\Actions\Emergencia;

use App\Models\Emergency;
use Illuminate\Validation\ValidationException;

final class EnsureEmergencyActive
{
    /** Nothing is recorded on an emergency already discharged */
    public static function check(Emergency $emergency): void
    {
        if (! $emergency->fresh()?->isActive()) {
            throw ValidationException::withMessages(['emergency' => 'Esta emergencia ya fue dada de alta.']);
        }
    }
}
