<?php

namespace App\Actions;

use App\Models\Appointment;

class CreateAppointment
{
    /** @param array<string, mixed> $data */
    public function handle(array $data): Appointment
    {
        // Appointments always start as 'pendiente', regardless of date.
        // Turns are only assigned from the Tablero when the patient arrives.
        $data['status'] = 'pendiente';

        return Appointment::create($data);
    }
}
