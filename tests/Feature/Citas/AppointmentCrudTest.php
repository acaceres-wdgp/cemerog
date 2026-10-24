<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('module.citas.access');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->patient = Patient::factory()->create();
});

// ─── Index ────────────────────────────────────────────────────────────────────

test('authorized user can GET /citas and receives required props', function () {
    $this->actingAs($this->user)
        ->get('/citas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('citas/index')
            ->has('appointments')
            ->has('doctors')
            ->has('date')
            ->has('is_today')
        );
});

test('unauthenticated user is redirected from /citas', function () {
    $this->get('/citas')->assertRedirect('/login');
});

test('user without permission gets 403 on GET /citas', function () {
    $noPerms = User::factory()->create();
    $this->actingAs($noPerms)->get('/citas')->assertForbidden();
});

test('index filters appointments by date', function () {
    $today    = Carbon::today()->toDateString();
    $tomorrow = Carbon::tomorrow()->toDateString();

    Appointment::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id,
        'appointment_date' => $today, 'status' => 'pendiente',
    ]);
    Appointment::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id,
        'appointment_date' => $tomorrow, 'status' => 'pendiente',
    ]);

    $this->actingAs($this->user)
        ->get("/citas?date={$today}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('citas/index')->has('appointments', 1));
});

// ─── Store ────────────────────────────────────────────────────────────────────

test('authorized user can store an appointment', function () {
    $this->actingAs($this->user)
        ->post('/citas', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'appointment_time' => '09:00',
            'type'             => 'consulta',
            'notes'            => null,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('appointments', [
        'patient_id' => $this->patient->id,
        'doctor_id'  => $this->doctor->id,
        'type'       => 'consulta',
        'status'     => 'pendiente',
    ]);
});

test('store always creates appointment as pendiente, even for today', function () {
    $this->actingAs($this->user)
        ->post('/citas', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'type'             => 'consulta',
        ])
        ->assertRedirect();

    $appointment = Appointment::first();
    expect($appointment->status)->toBe('pendiente');
});

test('store does not create a turn', function () {
    $this->actingAs($this->user)
        ->post('/citas', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'type'             => 'consulta',
        ])
        ->assertRedirect();

    $this->assertDatabaseCount('turns', 0);
});

test('store redirects with flash success', function () {
    $this->actingAs($this->user)
        ->post('/citas', [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'appointment_time' => '10:00',
            'type'             => 'seguimiento',
        ])
        ->assertRedirect()
        ->assertSessionHas('flash');
});

test('unauthorized user gets 403 on POST /citas', function () {
    $noPerms = User::factory()->create();
    $this->actingAs($noPerms)
        ->post('/citas', [
            'patient_id' => $this->patient->id, 'doctor_id' => $this->doctor->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(), 'type' => 'consulta',
        ])
        ->assertForbidden();
});

test('store validates required fields', function () {
    $this->actingAs($this->user)
        ->post('/citas', [])
        ->assertSessionHasErrors(['patient_id', 'doctor_id', 'appointment_date', 'type']);
});

test('store validates patient_id exists', function () {
    $this->actingAs($this->user)
        ->post('/citas', [
            'patient_id' => 99999, 'doctor_id' => $this->doctor->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(), 'type' => 'consulta',
        ])
        ->assertSessionHasErrors(['patient_id']);
});

test('store validates doctor_id exists', function () {
    $this->actingAs($this->user)
        ->post('/citas', [
            'patient_id' => $this->patient->id, 'doctor_id' => 99999,
            'appointment_date' => Carbon::tomorrow()->toDateString(), 'type' => 'consulta',
        ])
        ->assertSessionHasErrors(['doctor_id']);
});

test('store validates type is in allowed values', function () {
    $this->actingAs($this->user)
        ->post('/citas', [
            'patient_id' => $this->patient->id, 'doctor_id' => $this->doctor->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(), 'type' => 'invalid_type',
        ])
        ->assertSessionHasErrors(['type']);
});

// ─── Update ───────────────────────────────────────────────────────────────────

test('authorized user can update an appointment', function () {
    $appointment = Appointment::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id,
        'appointment_date' => Carbon::tomorrow()->toDateString(),
        'type' => 'consulta', 'status' => 'pendiente',
    ]);

    $this->actingAs($this->user)
        ->put("/citas/{$appointment->id}", [
            'patient_id'       => $this->patient->id,
            'doctor_id'        => $this->doctor->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'type'             => 'seguimiento',
            'notes'            => 'Actualización de prueba',
        ])
        ->assertRedirect();

    expect($appointment->fresh()->type)->toBe('seguimiento');
    expect($appointment->fresh()->notes)->toBe('Actualización de prueba');
});

test('unauthorized user gets 403 on PUT /citas/{appointment}', function () {
    $noPerms = User::factory()->create();
    $appointment = Appointment::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id,
        'appointment_date' => Carbon::tomorrow()->toDateString(),
    ]);

    $this->actingAs($noPerms)
        ->put("/citas/{$appointment->id}", [
            'patient_id' => $this->patient->id, 'doctor_id' => $this->doctor->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(), 'type' => 'consulta',
        ])
        ->assertForbidden();
});

// ─── Cancel ───────────────────────────────────────────────────────────────────

test('authorized user can cancel an appointment', function () {
    $appointment = Appointment::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id,
        'appointment_date' => Carbon::tomorrow()->toDateString(), 'status' => 'pendiente',
    ]);

    $this->actingAs($this->user)
        ->delete("/citas/{$appointment->id}")
        ->assertRedirect();

    expect($appointment->fresh()->status)->toBe('cancelada');
});

test('unauthorized user gets 403 on DELETE /citas/{appointment}', function () {
    $noPerms = User::factory()->create();
    $appointment = Appointment::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id,
        'appointment_date' => Carbon::tomorrow()->toDateString(),
    ]);

    $this->actingAs($noPerms)
        ->delete("/citas/{$appointment->id}")
        ->assertForbidden();
});
