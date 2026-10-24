<?php

use App\Models\Specialty;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->givePermissionTo('module.doctores.access');
});

// ─── Index ────────────────────────────────────────────────────────────────────

test('admin can view doctores index with specialties and doctors props', function () {
    Specialty::factory()->create(['name' => 'Medicina General']);

    $this->actingAs($this->admin)
        ->get('/admin/doctores')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('doctores/index')
            ->has('specialties')
            ->has('doctors')
        );
});

test('non-admin gets 403 on doctores index', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin/doctores')
        ->assertForbidden();
});

// ─── Store Specialty ──────────────────────────────────────────────────────────

test('admin can create a specialty', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => 'Dermatología',
            'consultation_price' => 250000,
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('specialties', [
        'name' => 'Dermatología',
        'consultation_price' => 250000,
    ]);
});

test('store specialty flashes success message', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => 'Neurología',
            'consultation_price' => 300000,
        ])
        ->assertRedirect(route('doctores'))
        ->assertSessionHas('flash');
});

test('non-admin cannot create specialty', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/admin/doctores/especialidades', [
            'name' => 'Cardiología',
            'consultation_price' => 200000,
        ])
        ->assertForbidden();
});

test('store specialty validates name is required', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => '',
            'consultation_price' => 100000,
        ])
        ->assertSessionHasErrors('name');
});

test('store specialty validates name max 100 chars', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => str_repeat('a', 101),
            'consultation_price' => 100000,
        ])
        ->assertSessionHasErrors('name');
});

test('store specialty validates name is unique', function () {
    Specialty::factory()->create(['name' => 'Pediatría']);

    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => 'Pediatría',
            'consultation_price' => 100000,
        ])
        ->assertSessionHasErrors('name');
});

test('store specialty validates consultation_price is required', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => 'Pediatría',
        ])
        ->assertSessionHasErrors('consultation_price');
});

test('store specialty validates consultation_price is integer', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => 'Pediatría',
            'consultation_price' => 'not-a-number',
        ])
        ->assertSessionHasErrors('consultation_price');
});

test('store specialty validates consultation_price min 0', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', [
            'name' => 'Pediatría',
            'consultation_price' => -1,
        ])
        ->assertSessionHasErrors('consultation_price');
});

// ─── Update Specialty ─────────────────────────────────────────────────────────

test('admin can update a specialty', function () {
    $specialty = Specialty::factory()->create([
        'name' => 'Medicina General',
        'consultation_price' => 100000,
    ]);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/especialidades/{$specialty->id}", [
            'name' => 'Medicina Interna',
            'consultation_price' => 150000,
        ])
        ->assertRedirect(route('doctores'));

    $this->assertDatabaseHas('specialties', [
        'id' => $specialty->id,
        'name' => 'Medicina Interna',
        'consultation_price' => 150000,
    ]);
});

test('update specialty allows same name for same record', function () {
    $specialty = Specialty::factory()->create(['name' => 'Ortopedia']);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/especialidades/{$specialty->id}", [
            'name' => 'Ortopedia',
            'consultation_price' => 200000,
        ])
        ->assertRedirect(route('doctores'));
});

test('update specialty rejects name taken by another record', function () {
    Specialty::factory()->create(['name' => 'Cardiología']);
    $specialty = Specialty::factory()->create(['name' => 'Ortopedia']);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/especialidades/{$specialty->id}", [
            'name' => 'Cardiología',
            'consultation_price' => 200000,
        ])
        ->assertSessionHasErrors('name');
});

test('non-admin cannot update specialty', function () {
    $specialty = Specialty::factory()->create();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put("/admin/doctores/especialidades/{$specialty->id}", [
            'name' => 'Nueva',
            'consultation_price' => 100000,
        ])
        ->assertForbidden();
});
