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
        $username = config('cemerog.admin.username');
        $password = config('cemerog.admin.password');

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

        app()['cache']->forget('spatie.permission.cache');
        $user->syncPermissions([]);
        $user->syncRoles(['administrador']);

        $this->command->info("Admin user '{$username}' seeded successfully.");
    }
}
