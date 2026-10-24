<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Turn;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Turn>
 */
class TurnFactory extends Factory
{
    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'appointment_id' => null,
            'turn_number' => 1,
            'turn_order' => 10,
            'status' => 'espera',
            'arrived_at' => now(),
            'notes' => null,
        ];
    }

    public function enConsulta(): static
    {
        return $this->state(fn () => ['status' => 'en_consulta']);
    }
}
