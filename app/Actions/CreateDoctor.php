<?php

namespace App\Actions;

use App\Models\Doctor;

class CreateDoctor
{
    /** @param array<string, mixed> $data */
    public function handle(array $data): Doctor
    {
        return Doctor::create($data);
    }
}
