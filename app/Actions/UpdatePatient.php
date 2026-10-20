<?php

namespace App\Actions;

use App\Models\Patient;

class UpdatePatient
{
    public function handle(Patient $patient, array $data): Patient
    {
        $patient->update($data);

        return $patient->fresh();
    }
}
