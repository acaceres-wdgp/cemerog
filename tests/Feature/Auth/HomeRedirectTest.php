<?php

use App\Actions\ResolveHomeRoute;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;

/**
 * Users land on the first module they can access, in sidebar order.
 */
beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

dataset('role_homes', [
    'administrador' => ['administrador', 'inicio'],
    'medico' => ['medico', 'inicio'],
    'secretaria' => ['secretaria', 'inicio'],
    'caja' => ['caja', 'inicio'],
    'enfermeria' => ['enfermeria', 'tablero'],
    'bioanalista' => ['bioanalista', 'lab'],
    'imagenes' => ['imagenes', 'img'],
    'almacen' => ['almacen', 'almacen'],
]);

test('home route resolves to the first accessible module', function (string $role, string $routeName) {
    $user = User::factory()->create();
    $user->assignRole($role);

    expect(app(ResolveHomeRoute::class)->handle($user))->toBe(route($routeName, absolute: false));
})->with('role_homes');

test('user without modules falls back to profile settings', function () {
    $user = User::factory()->create();

    expect(app(ResolveHomeRoute::class)->handle($user))->toBe(route('profile.edit', absolute: false));
});

test('login redirects each role to its home', function (string $role, string $routeName) {
    $user = User::factory()->create(['password' => bcrypt('password')]);
    $user->assignRole($role);

    $this->post('/login', ['username' => $user->username, 'password' => 'password'])
        ->assertRedirect(route($routeName, absolute: false));
})->with('role_homes');

test('home of each role is reachable after login', function (string $role, string $routeName) {
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->withoutVite()->actingAs($user)->get(route($routeName))->assertOk();
})->with('role_homes');

test('changing a required password redirects to the role home', function () {
    $user = User::factory()->mustChangePassword()->create();
    $user->assignRole('bioanalista');

    $this->actingAs($user)
        ->post('/password/change-required', [
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ])
        ->assertRedirect(route('lab', absolute: false));
});

test('authenticated user visiting root is redirected to the role home', function () {
    $user = User::factory()->create();
    $user->assignRole('almacen');

    $this->actingAs($user)->get('/')->assertRedirect(route('almacen', absolute: false));
});

test('authenticated user visiting login is redirected to the role home', function () {
    $user = User::factory()->create();
    $user->assignRole('imagenes');

    $this->actingAs($user)->get('/login')->assertRedirect(route('img', absolute: false));
});
