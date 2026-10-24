<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    /**
     * Demo users + 40 patients + turns + allergies for local development.
     */
    public function run(): void
    {
        if (! app()->isLocal()) {
            $this->command->warn('DemoSeeder skipped: not running in local environment.');

            return;
        }

        // ── Demo users ────────────────────────────────────────────────────────
        $demoUsers = [
            ['username' => 'medico',      'name' => 'Dr. Demo Médico',    'role' => 'medico'],
            ['username' => 'enfermeria',  'name' => 'Demo Enfermería',     'role' => 'enfermeria'],
            ['username' => 'secretaria',  'name' => 'Demo Secretaría',     'role' => 'secretaria'],
            ['username' => 'bioanalista', 'name' => 'Demo Bioanalista',    'role' => 'bioanalista'],
            ['username' => 'imagenes',    'name' => 'Demo Imágenes',       'role' => 'imagenes'],
            ['username' => 'cajero',      'name' => 'Demo Caja',           'role' => 'caja'],
            ['username' => 'almacenero',  'name' => 'Demo Almacén',        'role' => 'almacen'],
        ];

        foreach ($demoUsers as $data) {
            $user = User::firstOrCreate(
                ['username' => $data['username']],
                [
                    'name' => $data['name'],
                    'username' => $data['username'],
                    'password' => 'password',
                    'is_active' => true,
                    'must_change_password' => false,
                ]
            );

            $user->syncRoles([$data['role']]);
        }

        // ── Specialties & doctors ─────────────────────────────────────────────
        $specialties = [
            ['name' => 'Medicina General', 'price' => 150000],
            ['name' => 'Pediatría', 'price' => 180000],
            ['name' => 'Ginecología', 'price' => 200000],
            ['name' => 'Cardiología', 'price' => 250000],
        ];

        $doctors = [];
        foreach ($specialties as $spec) {
            $specialty = Specialty::firstOrCreate(
                ['name' => $spec['name']],
                ['consultation_price' => $spec['price']]
            );

            $doctors[] = Doctor::firstOrCreate(
                ['exequatur' => 'EX-'.str_pad((string) $specialty->id, 5, '0', STR_PAD_LEFT)],
                [
                    'name' => 'Dr. Demo '.$spec['name'],
                    'specialty_id' => $specialty->id,
                    'is_active' => true,
                    'phone' => '809-'.fake()->numerify('###-####'),
                ]
            );
        }

        // ── 40 demo patients ──────────────────────────────────────────────────
        if (Patient::count() >= 40) {
            $this->command->info('Patients already seeded. Skipping.');
        } else {
            $allergiesList = [
                'Penicilina',
                'Ibuprofeno',
                'Sulfas',
                'Látex',
                'Mariscos',
                'Penicilina, Aspirina',
                null, null, null, null, null, null, null, // more nulls = more no-allergy patients
            ];

            $bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null, null];

            $documentBase = 10000000;

            for ($i = 1; $i <= 40; $i++) {
                $docNum = str_pad((string) ($documentBase + $i), 11, '0', STR_PAD_LEFT);
                $formatted = substr($docNum, 0, 3).'-'.substr($docNum, 3, 7).'-'.substr($docNum, 10, 1);

                $sex = fake()->randomElement(['M', 'F', 'F', 'M', 'F']);
                $allergy = $allergiesList[array_rand($allergiesList)];
                $blood = $bloodTypes[array_rand($bloodTypes)];

                $patient = Patient::create([
                    'document_type' => 'cedula',
                    'document_number' => $formatted,
                    'first_names' => $sex === 'F' ? fake()->firstNameFemale() : fake()->firstNameMale(),
                    'last_names' => fake()->lastName().' '.fake()->lastName(),
                    'birth_date' => fake()->dateTimeBetween('-75 years', '-5 years')->format('Y-m-d'),
                    'sex' => $sex,
                    'phone' => '809-'.fake()->numerify('###-####'),
                    'address' => fake()->optional(0.7)->address(),
                    'blood_type' => $blood,
                    'allergies' => $allergy,
                    'emergency_contact_name' => fake()->optional(0.6)->name(),
                    'emergency_contact_phone' => fake()->optional(0.6)->numerify('809-###-####'),
                ]);

                // Add 0–6 historical turns for this patient
                $turnCount = fake()->numberBetween(0, 6);
                for ($t = 0; $t < $turnCount; $t++) {
                    $daysAgo = fake()->numberBetween(1, 365);
                    $doctor = $doctors[array_rand($doctors)];

                    Turn::create([
                        'patient_id' => $patient->id,
                        'doctor_id' => $doctor->id,
                        'turn_number' => $t + 1,
                        'turn_order' => ($t + 1) * 10,
                        'status' => fake()->randomElement(['atendido', 'atendido', 'atendido', 'no_asistio']),
                        'arrived_at' => now()->subDays($daysAgo)->setTime(
                            fake()->numberBetween(7, 17),
                            fake()->randomElement([0, 15, 30, 45])
                        ),
                        'notes' => fake()->optional(0.4)->sentence(),
                    ]);
                }
            }

            // Add some turns for today so the "Atendidos hoy" counter is non-zero
            $todayPatients = Patient::inRandomOrder()->limit(6)->get();
            foreach ($todayPatients as $idx => $patient) {
                $doctor = $doctors[$idx % count($doctors)];
                Turn::create([
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'turn_number' => $idx + 1,
                    'turn_order' => ($idx + 1) * 10,
                    'status' => $idx < 3 ? 'atendido' : 'espera',
                    'arrived_at' => now()->setTime(8 + $idx, 0),
                    'notes' => null,
                ]);
            }

            $this->command->info('40 demo patients seeded successfully.');
        }

        $this->command->info('Demo data seeded successfully.');
    }
}
