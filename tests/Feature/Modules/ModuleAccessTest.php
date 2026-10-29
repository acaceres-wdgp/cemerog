<?php

use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\User;

/**
 * Verify that module routes enforce authentication and permissions.
 *
 * Note: /consulta uses the 'attend-patients' middleware which requires BOTH
 * module.consulta.access AND an active linked doctor. It is excluded from the
 * generic permission-only datasets and tested separately below.
 */
dataset('modules', [
    'inicio' => ['/inicio', 'inicio'],
    'tablero' => ['/tablero', 'tablero'],
    'registro' => ['/registro', 'registro'],
    'citas' => ['/citas', 'citas'],
    'emergencia' => ['/emergencia', 'emergencia'],
    'internamiento' => ['/internamiento', 'internamiento'],
    'cirugia' => ['/cirugia', 'cirugia'],
    'laboratorio' => ['/laboratorio', 'lab'],
    'imagenes' => ['/imagenes', 'img'],
    'impresos' => ['/impresos', 'impresos'],
    'caja' => ['/facturacion', 'caja'],
    'cxc' => ['/cuentas-por-cobrar', 'cxc'],
    'cuadre' => ['/cuadre-de-caja', 'cuadre'],
    'almacen' => ['/almacen', 'almacen'],
    'entrada' => ['/entrada-mercancia', 'entrada'],
    'admin' => ['/admin/usuarios', 'admin'],
    'doctores' => ['/admin/doctores', 'doctores'],
    'analisis' => ['/admin/analisis', 'analisis'],
    'imgcat' => ['/admin/imagenes-catalogo', 'imgcat'],
    'precios' => ['/admin/precios', 'precios'],
    'habs' => ['/admin/habitaciones', 'habs'],
    'tema' => ['/admin/tema', 'tema'],
]);

test('unauthenticated user is redirected to login', function (string $url, string $key) {
    $this->get($url)->assertRedirect('/login');
})->with('modules');

test('user without permission gets 403', function (string $url, string $key) {
    $user = User::factory()->create();

    $this->actingAs($user)->get($url)->assertForbidden();
})->with('modules');

test('user with correct permission can access module', function (string $url, string $key) {
    $user = User::factory()->create();
    $user->givePermissionTo("module.{$key}.access");

    $this->actingAs($user)->get($url)->assertOk();
})->with('modules');

// ─── Consulta: requires permission AND active linked doctor ───────────────────

test('unauthenticated user is redirected to login from /consulta', function () {
    $this->get('/consulta')->assertRedirect('/login');
});

test('user without permission gets 403 on /consulta', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get('/consulta')->assertForbidden();
});

test('user with module.consulta.access but no linked doctor gets 403 on /consulta', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.consulta.access');
    // No doctor linked
    $this->actingAs($user)->get('/consulta')->assertForbidden();
});

test('medico with active linked doctor can access /consulta', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');
    $specialty = Specialty::factory()->create();
    Doctor::factory()->create([
        'user_id' => $user->id,
        'specialty_id' => $specialty->id,
        'is_active' => true,
    ]);

    $this->actingAs($user)->get('/consulta')->assertOk();
});

// ─── Administrator access ─────────────────────────────────────────────────────

test('administrator can access all modules (excluding consulta which requires active doctor)', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    collect([
        '/inicio', '/tablero', '/registro', '/citas',
        '/emergencia', '/internamiento', '/cirugia',
        '/laboratorio', '/imagenes', '/impresos', '/facturacion',
        '/cuentas-por-cobrar', '/cuadre-de-caja',
        '/almacen', '/entrada-mercancia',
        '/admin/usuarios', '/admin/doctores', '/admin/analisis',
        '/admin/imagenes-catalogo', '/admin/precios', '/admin/habitaciones', '/admin/tema',
    ])->each(function (string $url) use ($admin) {
        $this->actingAs($admin)->get($url)->assertOk();
    });
});

test('owner (administrador + medico + active doctor) can access /consulta', function () {
    $owner = User::factory()->create();
    $owner->assignRole('administrador');
    $owner->assignRole('medico');
    $specialty = Specialty::factory()->create();
    Doctor::factory()->create([
        'user_id' => $owner->id,
        'specialty_id' => $specialty->id,
        'is_active' => true,
    ]);

    $this->actingAs($owner)->get('/consulta')->assertOk();
});
