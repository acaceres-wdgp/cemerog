<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'appointment_date' => $this->faker->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'appointment_time' => $this->faker->boolean(70) ? $this->faker->time('H:i') : null,
            'type' => $this->faker->randomElement(['consulta', 'seguimiento', 'primera_vez']),
            'status' => $this->faker->randomElement(['pendiente', 'confirmada', 'cancelada', 'no_asistio']),
            'notes' => $this->faker->boolean(30) ? $this->faker->sentence() : null,
        ];
    }

    public function today(): static
    {
        return $this->state(fn () => ['appointment_date' => now()->toDateString()]);
    }

    public function pendiente(): static
    {
        return $this->state(fn () => ['status' => 'pendiente']);
    }
}
