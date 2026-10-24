<?php

namespace Database\Factories;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Consultation>
 */
class ConsultationFactory extends Factory
{
    protected $model = Consultation::class;

    public function definition(): array
    {
        return [
            'patient_id' => Patient::factory(),
            'doctor_id' => Doctor::factory(),
            'turn_id' => null,
            'peso' => fake()->numberBetween(500, 1200),
            'talla' => fake()->numberBetween(140, 200),
            'temp' => fake()->numberBetween(360, 380),
            'presion_arterial' => '120/80',
            'frecuencia_cardiaca' => fake()->numberBetween(60, 100),
            'frecuencia_respiratoria' => fake()->numberBetween(12, 20),
            'saturacion_o2' => fake()->numberBetween(95, 100),
            'glucemia' => fake()->numberBetween(70, 110),
            'motivo_consulta' => fake()->sentence(),
            'historia_enfermedad' => fake()->paragraph(),
            'examen_fisico' => fake()->paragraph(),
            'diagnosticos' => [['code' => 'J06.9', 'label' => 'Infección aguda de las vías respiratorias superiores']],
            'plan_tratamiento' => fake()->paragraph(),
            'consulted_at' => now(),
        ];
    }
}
