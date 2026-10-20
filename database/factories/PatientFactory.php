<?php

namespace Database\Factories;

use App\Models\Patient;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Patient>
 */
class PatientFactory extends Factory
{
    public function definition(): array
    {
        $sex = fake()->randomElement(['M', 'F']);

        return [
            'document_type' => 'cedula',
            'document_number' => fake()->unique()->numerify('###-#######-#'),
            'first_names' => $sex === 'F' ? fake('es_DO')->firstNameFemale() : fake('es_DO')->firstNameMale(),
            'last_names' => fake('es_DO')->lastName().' '.fake('es_DO')->lastName(),
            'birth_date' => fake()->dateTimeBetween('-80 years', '-1 year')->format('Y-m-d'),
            'sex' => $sex,
            'phone' => fake()->numerify('809-###-####'),
            'address' => fake()->address(),
            'blood_type' => fake()->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null]),
            'allergies' => fake()->boolean(20) ? fake()->words(3, true) : null,
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => fake()->numerify('809-###-####'),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => ['is_active' => false]);
    }
}
