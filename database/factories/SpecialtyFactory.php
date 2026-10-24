<?php

namespace Database\Factories;

use App\Models\Specialty;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Specialty>
 */
class SpecialtyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->words(2, true),
            'consultation_price' => $this->faker->numberBetween(50000, 500000),
        ];
    }
}
