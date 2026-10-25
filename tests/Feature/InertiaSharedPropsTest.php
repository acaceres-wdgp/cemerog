<?php

use App\Models\Doctor;
use App\Models\Specialty;
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

// ─── doctor shared prop ───────────────────────────────────────────────────────

test('usuario con doctor vinculado recibe el prop doctor con id, name y office', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
        'name' => 'Dra. Test',
        'office' => 'Consultorio 1',
    ]);

    $this->actingAs($user)
        ->get('/tablero')
        ->assertInertia(fn ($page) => $page
            ->has('doctor')
            ->where('doctor.name', 'Dra. Test')
            ->where('doctor.office', 'Consultorio 1')
            ->has('doctor.id')
        );
});

test('usuario sin doctor vinculado recibe el prop doctor como null', function () {
    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $this->actingAs($user)
        ->get('/tablero')
        ->assertInertia(fn ($page) => $page
            ->where('doctor', null)
        );
});
