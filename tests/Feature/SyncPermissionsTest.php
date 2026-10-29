<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;

test('el seeder es idempotente: ejecutarlo dos veces no duplica permisos', function () {
    Artisan::call('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);
    Artisan::call('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);

    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    // Permission should appear exactly once
    $count = $admin->getAllPermissions()
        ->where('name', 'module.pacientes.access')
        ->count();

    expect($count)->toBe(1);
});

test('el administrador no tiene module.consulta.access (requiere rol medico + doctor vinculado)', function () {
    Artisan::call('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);

    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $has = $admin->getAllPermissions()
        ->where('name', 'module.consulta.access')
        ->isNotEmpty();

    expect($has)->toBeFalse();
});

test('el medico tiene module.consulta.access', function () {
    Artisan::call('db:seed', ['--class' => 'RolesAndPermissionsSeeder']);

    $medico = User::factory()->create();
    $medico->assignRole('medico');

    $has = $medico->getAllPermissions()
        ->where('name', 'module.consulta.access')
        ->isNotEmpty();

    expect($has)->toBeTrue();
});

test('GET /pacientes retorna 200 y el componente correcto para el admin', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $this->actingAs($admin)
        ->get('/pacientes')
        ->assertInertia(fn ($page) => $page->component('pacientes/index'));
});

test('el comando cemerog:sync-permissions termina sin errores', function () {
    $exit = Artisan::call('cemerog:sync-permissions');
    expect($exit)->toBe(0);
});
