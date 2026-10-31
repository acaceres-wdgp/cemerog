<?php

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);

    // Non-admin medico (doctor A)
    $this->doctorA = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->medico = User::factory()->create();
    $this->medico->givePermissionTo('module.tablero.access');
    $this->medico->assignRole('medico');
    $this->doctorA->update(['user_id' => $this->medico->id]);
    $this->medico->refresh();
    $this->doctorA->refresh();

    // Doctor B – no user link
    $this->doctorB = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);

    $this->patient = Patient::factory()->create();
    $this->patientB = Patient::factory()->create();
});

// ─── updateStatus – other doctor's turn ──────────────────────────────────────

test('medico gets 403 when changing status of another doctors turn', function () {
    $turnB = Turn::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->medico)
        ->patch("/tablero/turnos/{$turnB->id}/status", ['status' => 'en_consulta'])
        ->assertForbidden();
});

test('medico can change status of their own turn', function () {
    $turnA = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->medico)
        ->patch("/tablero/turnos/{$turnA->id}/status", ['status' => 'en_consulta'])
        ->assertRedirect(route('tablero'));

    expect($turnA->fresh()->status)->toBe('en_consulta');
});

// ─── reorder – other doctor's turn ───────────────────────────────────────────

test('medico gets 403 when reordering another doctors turn', function () {
    Turn::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_order' => 10,
    ]);
    $turnB2 = Turn::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_order' => 20,
    ]);

    $this->actingAs($this->medico)
        ->patch("/tablero/turnos/{$turnB2->id}/reorder", ['direction' => 'up'])
        ->assertForbidden();
});

test('medico can reorder their own turn', function () {
    $turnA1 = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_order' => 10,
    ]);
    $turnA2 = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_order' => 20,
    ]);

    $this->actingAs($this->medico)
        ->patch("/tablero/turnos/{$turnA2->id}/reorder", ['direction' => 'up'])
        ->assertRedirect(route('tablero'));
});
