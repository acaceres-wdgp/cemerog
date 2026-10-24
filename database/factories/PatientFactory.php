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
            'email' => fake()->optional(0.6)->safeEmail(),
            'first_names' => $sex === 'F' ? fake()->firstNameFemale() : fake()->firstNameMale(),
            'last_names' => fake()->lastName().' '.fake()->lastName(),
            'birth_date' => fake()->dateTimeBetween('-80 years', '-1 year')->format('Y-m-d'),
            'sex' => $sex,
            'phone' => fake()->optional(0.9)->numerify('809-###-####'),
            'address' => fake()->optional(0.7)->address(),
            'blood_type' => fake()->optional()->randomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
            'allergies' => fake()->boolean(20) ? fake()->words(3, true) : null,
            'emergency_contact_name' => fake()->name(),
            'emergency_contact_phone' => fake()->numerify('809-###-####'),
        ];
    }
}
