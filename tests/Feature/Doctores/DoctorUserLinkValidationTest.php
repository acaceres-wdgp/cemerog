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

// ─── Store: user_id + office ───────────────────────────────────────────────────

test('creating a doctor with a valid medico user links them correctly', function () {
    $medicoUser = User::factory()->create();
    $medicoUser->assignRole('medico');

    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dra. María García',
            'specialty_id' => $this->specialty->id,
            'user_id' => $medicoUser->id,
            'office' => 'Consultorio 1',
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'name' => 'Dra. María García',
        'user_id' => $medicoUser->id,
        'office' => 'Consultorio 1',
    ]);
});

test('creating a doctor without user_id is allowed (nullable)', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Sin Usuario',
            'specialty_id' => $this->specialty->id,
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'name' => 'Dr. Sin Usuario',
        'user_id' => null,
    ]);
});

test('cannot create doctor with a user already linked to another doctor', function () {
    $medicoUser = User::factory()->create();
    $medicoUser->assignRole('medico');

    // Link user to first doctor
    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $medicoUser->id,
    ]);

    // Attempt to link same user to a second doctor
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Duplicado',
            'specialty_id' => $this->specialty->id,
            'user_id' => $medicoUser->id,
        ])
        ->assertSessionHasErrors('user_id');
});

test('cannot create doctor with a user that does not have the medico role', function () {
    $nonMedicoUser = User::factory()->create();
    $nonMedicoUser->assignRole('secretaria');

    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Test',
            'specialty_id' => $this->specialty->id,
            'user_id' => $nonMedicoUser->id,
        ])
        ->assertSessionHasErrors('user_id');
});

test('cannot create doctor with a non-existent user_id', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Test',
            'specialty_id' => $this->specialty->id,
            'user_id' => 99999,
        ])
        ->assertSessionHasErrors('user_id');
});

test('store doctor validates office max 100 chars', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Test',
            'specialty_id' => $this->specialty->id,
            'office' => str_repeat('x', 101),
        ])
        ->assertSessionHasErrors('office');
});

// ─── Update: user_id + office ─────────────────────────────────────────────────

test('admin can update a doctor to link a medico user', function () {
    $doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => null,
    ]);

    $medicoUser = User::factory()->create();
    $medicoUser->assignRole('medico');

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", [
            'name' => $doctor->name,
            'specialty_id' => $this->specialty->id,
            'user_id' => $medicoUser->id,
            'office' => 'Consultorio 3',
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'id' => $doctor->id,
        'user_id' => $medicoUser->id,
        'office' => 'Consultorio 3',
    ]);
});

test('admin can keep the same user_id when updating a doctor (unique except self)', function () {
    $medicoUser = User::factory()->create();
    $medicoUser->assignRole('medico');

    $doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $medicoUser->id,
    ]);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", [
            'name' => 'Nombre Actualizado',
            'specialty_id' => $this->specialty->id,
            'user_id' => $medicoUser->id,
            'office' => 'Consultorio 1',
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'id' => $doctor->id,
        'name' => 'Nombre Actualizado',
        'user_id' => $medicoUser->id,
    ]);
});

test('cannot update doctor to steal user_id from another doctor', function () {
    $medicoUser = User::factory()->create();
    $medicoUser->assignRole('medico');

    // First doctor owns the user
    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $medicoUser->id,
    ]);

    // Second doctor tries to steal the user
    $doctor2 = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => null,
    ]);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor2->id}", [
            'name' => $doctor2->name,
            'specialty_id' => $this->specialty->id,
            'user_id' => $medicoUser->id,
        ])
        ->assertSessionHasErrors('user_id');
});

test('cannot update doctor with a user that does not have medico role', function () {
    $doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
    ]);

    $nonMedicoUser = User::factory()->create();
    $nonMedicoUser->assignRole('caja');

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", [
            'name' => $doctor->name,
            'specialty_id' => $this->specialty->id,
            'user_id' => $nonMedicoUser->id,
        ])
        ->assertSessionHasErrors('user_id');
});

test('update doctor validates office max 100 chars', function () {
    $doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id]);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", [
            'name' => $doctor->name,
            'specialty_id' => $this->specialty->id,
            'office' => str_repeat('x', 101),
        ])
        ->assertSessionHasErrors('office');
});
