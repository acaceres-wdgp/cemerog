<?php

namespace App\Actions;

use App\Models\Specialty;

class CreateSpecialty
{
    /** @param array<string, mixed> $data */
    public function handle(array $data): Specialty
    {
        return Specialty::create($data);
    }
}
