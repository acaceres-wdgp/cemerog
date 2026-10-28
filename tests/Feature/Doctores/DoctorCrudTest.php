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

// ─── Store Doctor ─────────────────────────────────────────────────────────────

test('admin can create a doctor', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Juan Pérez',
            'exequatur' => 'EX-001234',
            'phone' => '809-555-0100',
            'specialty_id' => $this->specialty->id,
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'name' => 'Dr. Juan Pérez',
        'exequatur' => 'EX-001234',
        'phone' => '809-555-0100',
        'specialty_id' => $this->specialty->id,
        'is_active' => true,
    ]);
});

test('store doctor flashes success message', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dra. Ana López',
            'specialty_id' => $this->specialty->id,
        ])
        ->assertRedirect(route('doctores'))
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Doctor registrado correctamente.');
});

test('admin can create doctor with optional fields omitted', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Sin Exequatur',
            'specialty_id' => $this->specialty->id,
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'name' => 'Dr. Sin Exequatur',
        'exequatur' => null,
        'phone' => null,
    ]);
});

test('non-admin cannot create doctor', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/admin/doctores', [
            'name' => 'Dr. Intruso',
            'specialty_id' => $this->specialty->id,
        ])
        ->assertForbidden();
});

test('store doctor validates name is required', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => '',
            'specialty_id' => $this->specialty->id,
        ])
        ->assertSessionHasErrors('name');
});

test('store doctor validates name max 100 chars', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => str_repeat('x', 101),
            'specialty_id' => $this->specialty->id,
        ])
        ->assertSessionHasErrors('name');
});

test('store doctor validates specialty_id is required', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Test',
        ])
        ->assertSessionHasErrors('specialty_id');
});

test('store doctor validates specialty_id exists', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Test',
            'specialty_id' => 9999,
        ])
        ->assertSessionHasErrors('specialty_id');
});

test('store doctor validates exequatur max 30 chars', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Test',
            'specialty_id' => $this->specialty->id,
            'exequatur' => str_repeat('E', 31),
        ])
        ->assertSessionHasErrors('exequatur');
});

test('store doctor validates phone max 20 chars', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Test',
            'specialty_id' => $this->specialty->id,
            'phone' => str_repeat('8', 21),
        ])
        ->assertSessionHasErrors('phone');
});

// ─── Update Doctor ────────────────────────────────────────────────────────────

test('admin can update a doctor', function () {
    $doctor = Doctor::factory()->create([
        'name' => 'Dr. Viejo',
        'specialty_id' => $this->specialty->id,
    ]);

    $specialty2 = Specialty::factory()->create(['name' => 'Cardiología']);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", [
            'name' => 'Dr. Nuevo',
            'specialty_id' => $specialty2->id,
            'exequatur' => 'EX-999999',
            'phone' => '849-000-0000',
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'id' => $doctor->id,
        'name' => 'Dr. Nuevo',
        'specialty_id' => $specialty2->id,
        'exequatur' => 'EX-999999',
        'phone' => '849-000-0000',
    ]);

    expect(session('inertia.flash_data.toast.type'))->toBe('success');
    expect(session('inertia.flash_data.toast.message'))->toBe('Doctor actualizado correctamente.');
});

test('non-admin cannot update doctor', function () {
    $doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id]);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put("/admin/doctores/{$doctor->id}", [
            'name' => 'Intruso',
            'specialty_id' => $this->specialty->id,
        ])
        ->assertForbidden();
});

// ─── Toggle Doctor ────────────────────────────────────────────────────────────

test('admin can toggle doctor active status to inactive', function () {
    $doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'is_active' => true,
    ]);

    $this->actingAs($this->admin)
        ->patch("/admin/doctores/{$doctor->id}/toggle")
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'id' => $doctor->id,
        'is_active' => false,
    ]);

    expect(session('inertia.flash_data.toast.type'))->toBe('success');
    expect(session('inertia.flash_data.toast.message'))->toBe('Estado del doctor actualizado.');
});

test('admin can toggle doctor active status to active', function () {
    $doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'is_active' => false,
    ]);

    $this->actingAs($this->admin)
        ->patch("/admin/doctores/{$doctor->id}/toggle")
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('doctors', [
        'id' => $doctor->id,
        'is_active' => true,
    ]);
});

test('non-admin cannot toggle doctor', function () {
    $doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id]);
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch("/admin/doctores/{$doctor->id}/toggle")
        ->assertForbidden();
});
