<?php

use App\Models\User;

/**
 * Users without any module land on a page that says so (ADR-026).
 */
test('a user without modules lands on the no-modules page after login', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);

    $this->post('/login', ['username' => $user->username, 'password' => 'password'])
        ->assertRedirect('/sin-modulos');
});

test('the no-modules page renders for an authenticated user', function () {
    $this->actingAs(User::factory()->create())
        ->get('/sin-modulos')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('sin-modulos/index'));
});

test('a user with modules is sent to their home instead', function (string $role, string $home) {
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->get('/sin-modulos')
        ->assertRedirect($home);
})->with([
    'administrador' => ['administrador', '/inicio'],
    'enfermeria (sin Inicio)' => ['enfermeria', '/tablero'],
    'bioanalista (sin Inicio)' => ['bioanalista', '/laboratorio'],
]);

test('a user with a single direct permission is sent to that module', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.almacen.access');

    $this->actingAs($user)->get('/sin-modulos')->assertRedirect('/almacen');
});

test('guests are sent to login', function () {
    $this->get('/sin-modulos')->assertRedirect(route('login'));
});

test('a user with a temporary password must change it first', function () {
    $this->actingAs(User::factory()->mustChangePassword()->create())
        ->get('/sin-modulos')
        ->assertRedirect(route('password.change-required'));
});
