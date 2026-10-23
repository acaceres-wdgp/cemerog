<?php

use App\Models\User;

/**
 * Verify that module routes enforce authentication and permissions.
 */
dataset('modules', [
    'inicio' => ['/inicio', 'inicio'],
    'tablero' => ['/tablero', 'tablero'],
    'registro' => ['/registro', 'registro'],
    'citas' => ['/citas', 'citas'],
    'consulta' => ['/consulta', 'consulta'],
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

test('administrator can access all modules', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    collect([
        '/inicio', '/tablero', '/registro', '/citas',
        '/consulta', '/emergencia', '/internamiento', '/cirugia',
        '/laboratorio', '/imagenes', '/impresos', '/facturacion',
        '/cuentas-por-cobrar', '/cuadre-de-caja',
        '/almacen', '/entrada-mercancia',
        '/admin/usuarios', '/admin/doctores', '/admin/analisis',
        '/admin/imagenes-catalogo', '/admin/precios', '/admin/habitaciones', '/admin/tema',
    ])->each(function (string $url) use ($admin) {
        $this->actingAs($admin)->get($url)->assertOk();
    });
});
