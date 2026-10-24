<?php

namespace App\Actions;

use App\Models\Specialty;

class CreateSpecialty
{
    public function handle(array $data): Specialty
    {
        return Specialty::create($data);
    }
}
