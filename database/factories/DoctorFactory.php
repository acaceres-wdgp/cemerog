<?php

namespace Database\Factories;

use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Doctor>
 */
class DoctorFactory extends Factory
{
    public function definition(): array
    {
        $prefix = $this->faker->randomElement(['Dr.', 'Dra.']);
        $name = "{$prefix} {$this->faker->firstName()} {$this->faker->lastName()}";

        return [
            'name' => $name,
            'exequatur' => 'EX-'.$this->faker->numerify('######'),
            'phone' => $this->faker->numerify('###-###-####'),
            'specialty_id' => Specialty::factory(),
            'is_active' => true,
        ];
    }
}
