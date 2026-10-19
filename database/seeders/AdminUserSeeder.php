<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds (idempotent).
     */
    public function run(): void
    {
        $username = env('ADMIN_USERNAME', 'admin');
        $password = env('ADMIN_PASSWORD', 'Admin123!');

        $user = User::firstOrCreate(
            ['username' => $username],
            [
                'name' => 'Administrador',
                'username' => $username,
                'password' => Hash::make($password),
                'is_active' => true,
                'must_change_password' => true,
            ]
        );

        $user->syncRoles(['administrador']);

        $this->command->info("Admin user '{$username}' seeded successfully.");
    }
}
