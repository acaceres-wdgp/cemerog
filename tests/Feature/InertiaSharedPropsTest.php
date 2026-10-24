<?php

use App\Models\User;

// Verify HandleInertiaRequests shares the correct permissions array

test('el admin recibe module.pacientes.access en los permissions compartidos', function () {
    $user = User::factory()->create();
    $user->assignRole('administrador');

    $this->actingAs($user)
        ->get('/tablero')
        ->assertInertia(fn ($page) => $page
            ->where('permissions', fn ($perms) => in_array('module.pacientes.access', collect($perms)->toArray()))
        );
});

test('la secretaria recibe module.pacientes.access en los permissions compartidos', function () {
    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $this->actingAs($user)
        ->get('/tablero')
        ->assertInertia(fn ($page) => $page
            ->where('permissions', fn ($perms) => in_array('module.pacientes.access', collect($perms)->toArray()))
        );
});

test('un usuario sin permisos no recibe module.pacientes.access', function () {
    $user = User::factory()->create();
    // No role assigned — lands on profile settings page

    $this->actingAs($user)
        ->get('/settings/profile')
        ->assertInertia(fn ($page) => $page
            ->where('permissions', fn ($perms) => ! in_array('module.pacientes.access', collect($perms)->toArray()))
        );
});
