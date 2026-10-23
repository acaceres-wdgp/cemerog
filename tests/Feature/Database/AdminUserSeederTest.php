<?php

use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Support\Facades\Hash;

test('admin user seeder uses the configured credentials', function () {
    config([
        'cemerog.admin.username' => 'jefe',
        'cemerog.admin.password' => 'Secreta123!',
    ]);

    $this->seed(AdminUserSeeder::class);

    $user = User::where('username', 'jefe')->firstOrFail();

    expect(Hash::check('Secreta123!', $user->password))->toBeTrue()
        ->and($user->hasRole('administrador'))->toBeTrue()
        ->and($user->must_change_password)->toBeTrue();
});
