<?php

use App\Models\User;

// A1 – access by role
dataset('roles_access_pacientes', [
    'administrador accede' => ['administrador', 200],
    'medico accede' => ['medico', 200],
    'secretaria accede' => ['secretaria', 200],
    'enfermeria denegado' => ['enfermeria', 403],
    'bioanalista denegado' => ['bioanalista', 403],
    'imagenes denegado' => ['imagenes', 403],
    'caja denegado' => ['caja', 403],
    'almacen denegado' => ['almacen', 403],
]);

test('/pacientes respeta acceso por rol', function (string $role, int $expectedStatus) {
    $user = User::factory()->create();

    // Only give module.pacientes.access to roles that should have it
    if (in_array($role, ['administrador', 'medico', 'secretaria'])) {
        $user->givePermissionTo('module.pacientes.access');
    }

    $this->actingAs($user)
        ->get('/pacientes')
        ->assertStatus($expectedStatus);
})->with('roles_access_pacientes');

test('/pacientes redirige usuarios no autenticados al login', function () {
    $this->get('/pacientes')->assertRedirect('/login');
});
