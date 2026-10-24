<?php

namespace App\Actions;

use App\Models\Specialty;

class UpdateSpecialty
{
    public function handle(Specialty $specialty, array $data): Specialty
    {
        $specialty->update($data);

        return $specialty;
    }
}
