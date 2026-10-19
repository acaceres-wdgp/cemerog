<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    /**
     * One demo user per role. Only intended for local environment.
     */
    public function run(): void
    {
        if (! app()->isLocal()) {
            $this->command->warn('DemoSeeder skipped: not running in local environment.');

            return;
        }

        $demoUsers = [
            ['username' => 'medico', 'name' => 'Dr. Demo Médico', 'role' => 'medico'],
            ['username' => 'enfermeria', 'name' => 'Demo Enfermería', 'role' => 'enfermeria'],
            ['username' => 'secretaria', 'name' => 'Demo Secretaría', 'role' => 'secretaria'],
            ['username' => 'bioanalista', 'name' => 'Demo Bioanalista', 'role' => 'bioanalista'],
            ['username' => 'imagenes', 'name' => 'Demo Imágenes', 'role' => 'imagenes'],
            ['username' => 'cajero', 'name' => 'Demo Caja', 'role' => 'caja'],
            ['username' => 'almacenero', 'name' => 'Demo Almacén', 'role' => 'almacen'],
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

        $this->command->info('Demo users seeded successfully.');
    }
}
