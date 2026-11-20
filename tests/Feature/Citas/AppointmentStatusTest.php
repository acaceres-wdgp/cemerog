<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('module.citas.access');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->patient = Patient::factory()->create();

    $this->appointment = Appointment::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'appointment_date' => today()->toDateString(),
        'status' => 'pendiente',
    ]);
});

test('marks today appointment as no_asistio and returns to the previous page', function () {
    $this->actingAs($this->user)
        ->from('/tablero')
        ->patch("/citas/{$this->appointment->id}/status", ['status' => 'no_asistio'])
        ->assertRedirect('/tablero')
        ->assertSessionHasNoErrors();

    expect($this->appointment->fresh()->status)->toBe('no_asistio');
});

test('rejects statuses that are not allowed', function (string $status) {
    $this->actingAs($this->user)
        ->from('/tablero')
        ->patch("/citas/{$this->appointment->id}/status", ['status' => $status])
        ->assertSessionHasErrors('status');

    expect($this->appointment->fresh()->status)->toBe('pendiente');
})->with(['cancelada', 'en_lista', 'atendida', 'otro']);

test('cannot mark as no_asistio an appointment whose patient already has a turn', function () {
    Turn::factory()->create([
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'appointment_id' => $this->appointment->id,
    ]);

    $this->actingAs($this->user)
        ->from('/tablero')
        ->patch("/citas/{$this->appointment->id}/status", ['status' => 'no_asistio'])
        ->assertSessionHasErrors('status');

    expect($this->appointment->fresh()->status)->toBe('pendiente');
});

test('cannot mark a future appointment as no_asistio', function () {
    $this->appointment->update(['appointment_date' => Carbon::tomorrow()->toDateString()]);

    $this->actingAs($this->user)
        ->from('/tablero')
        ->patch("/citas/{$this->appointment->id}/status", ['status' => 'no_asistio'])
        ->assertSessionHasErrors('status');

    expect($this->appointment->fresh()->status)->toBe('pendiente');
});

test('user without citas permission gets 403', function () {
    $other = User::factory()->create();
    $other->givePermissionTo('module.tablero.access');

    $this->actingAs($other)
        ->patch("/citas/{$this->appointment->id}/status", ['status' => 'no_asistio'])
        ->assertForbidden();

    expect($this->appointment->fresh()->status)->toBe('pendiente');
});

test('medico cannot change the status of another doctors appointment', function () {
    $medico = User::factory()->create();
    $medico->givePermissionTo('module.citas.access');
    $medico->assignRole('medico');
    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'is_active' => true,
        'user_id' => $medico->id,
    ]);

    $this->actingAs($medico->refresh())
        ->patch("/citas/{$this->appointment->id}/status", ['status' => 'no_asistio'])
        ->assertForbidden();

    expect($this->appointment->fresh()->status)->toBe('pendiente');
});
