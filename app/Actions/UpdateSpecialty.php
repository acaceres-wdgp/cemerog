<?php

namespace App\Actions;

use App\Models\Specialty;

class UpdateSpecialty
{
    /** @param array<string, mixed> $data */
    public function handle(Specialty $specialty, array $data): Specialty
    {
        $specialty->update($data);

        return $specialty;
    }
}
