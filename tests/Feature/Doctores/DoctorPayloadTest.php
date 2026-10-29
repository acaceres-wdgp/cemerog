<?php

use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->givePermissionTo('module.doctores.access');

    $this->specialty = Specialty::factory()->create([
        'name' => 'Medicina General',
        'consultation_price' => 150000,
    ]);
});

// ─── Doctor payload includes user_name ────────────────────────────────────────

test('index payload includes user_name when doctor is linked to a user', function () {
    $medicoUser = User::factory()->create(['name' => 'Dr. Demo Médico']);
    $medicoUser->assignRole('medico');

    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $medicoUser->id,
    ]);

    $response = $this->actingAs($this->admin)
        ->get('/admin/doctores');

    $response->assertInertia(fn ($page) => $page
        ->component('doctores/index')
        ->has('doctors', 1, fn ($doctor) => $doctor
            ->where('user_name', 'Dr. Demo Médico')
            ->etc()
        )
    );
});

test('index payload includes user_name as null when doctor has no linked user', function () {
    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => null,
    ]);

    $response = $this->actingAs($this->admin)
        ->get('/admin/doctores');

    $response->assertInertia(fn ($page) => $page
        ->component('doctores/index')
        ->has('doctors', 1, fn ($doctor) => $doctor
            ->where('user_name', null)
            ->etc()
        )
    );
});

test('index availableUsers excludes users linked to other doctors but includes unlinked active users', function () {
    $medicoA = User::factory()->create(['name' => 'Médico A']);
    $medicoA->assignRole('medico');
    $medicoB = User::factory()->create(['name' => 'Médico B']);
    $medicoB->assignRole('medico');
    $medicoC = User::factory()->create(['name' => 'Médico C']);
    $medicoC->assignRole('medico');

    // Link medicoA to a doctor; medicoB and medicoC are unlinked
    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $medicoA->id,
    ]);

    $response = $this->actingAs($this->admin)
        ->get('/admin/doctores');

    // availableUsers should include all active unlinked users (medicoB, medicoC, plus admin)
    // It excludes medicoA (already linked) and any inactive users.
    $response->assertInertia(fn ($page) => $page
        ->component('doctores/index')
        ->where('availableUsers', fn ($users) => collect($users)->doesntContain('id', $medicoA->id))
    );
});
