<?php

namespace App\Actions;

use App\Models\Doctor;

class CreateDoctor
{
    public function handle(array $data): Doctor
    {
        return Doctor::create($data);
    }
}
