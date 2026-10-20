<?php

namespace App\Actions;

use App\Models\Patient;

class CreatePatient
{
    public function handle(array $data): Patient
    {
        return Patient::create($data);
    }
}
