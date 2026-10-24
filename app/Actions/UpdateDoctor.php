<?php

namespace App\Actions;

use App\Models\Doctor;

class UpdateDoctor
{
    /** @param array<string, mixed> $data */
    public function handle(Doctor $doctor, array $data): Doctor
    {
        $doctor->update($data);

        return $doctor;
    }
}
