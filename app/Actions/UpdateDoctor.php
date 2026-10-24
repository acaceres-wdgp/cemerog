<?php

namespace App\Actions;

use App\Models\Doctor;

class UpdateDoctor
{
    public function handle(Doctor $doctor, array $data): Doctor
    {
        $doctor->update($data);

        return $doctor;
    }
}
