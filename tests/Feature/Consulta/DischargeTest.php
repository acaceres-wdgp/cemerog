<?php

use App\Models\Discharge;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('medico');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $this->user->id,
        'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();

    $this->turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);
});

// ─── Rollback ─────────────────────────────────────────────────────────────────

test('discharges migration can be rolled back', function () {
    $migration = '2026_10_29_170307_create_discharges_table';

    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('discharges'))->toBeFalse();

    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('discharges'))->toBeTrue();
});

// ─── Alta recuperado ──────────────────────────────────────────────────────────

test('discharge with type recuperado creates discharge record and turn becomes atendido', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Gripe estacional resuelta',
        ])
        ->assertRedirect();

    expect($this->turn->fresh()->status)->toBe('atendido');

    $this->assertDatabaseHas('discharges', [
        'turn_id' => $this->turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'type' => 'recuperado',
        'discharge_diagnosis' => 'Gripe estacional resuelta',
        'created_by' => $this->user->id,
    ]);
});

// ─── Alta traslado ────────────────────────────────────────────────────────────

test('discharge with type traslado creates discharge record with destination and turn becomes atendido', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'traslado',
            'destination' => 'Hospital Dr. Salvador B. Gautier',
            'reason' => 'A petición del familiar',
            'discharge_diagnosis' => 'Fractura de fémur',
        ])
        ->assertRedirect();

    expect($this->turn->fresh()->status)->toBe('atendido');

    $this->assertDatabaseHas('discharges', [
        'turn_id' => $this->turn->id,
        'type' => 'traslado',
        'destination' => 'Hospital Dr. Salvador B. Gautier',
        'reason' => 'A petición del familiar',
        'discharge_diagnosis' => 'Fractura de fémur',
    ]);
});

// ─── Alta defuncion ───────────────────────────────────────────────────────────

test('discharge with type defuncion creates discharge record and turn becomes atendido', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'defuncion',
            'discharge_diagnosis' => 'Paro cardiorrespiratorio',
        ])
        ->assertRedirect();

    expect($this->turn->fresh()->status)->toBe('atendido');

    $this->assertDatabaseHas('discharges', [
        'turn_id' => $this->turn->id,
        'type' => 'defuncion',
        'discharge_diagnosis' => 'Paro cardiorrespiratorio',
    ]);
});

// ─── Validations ──────────────────────────────────────────────────────────────

test('traslado without destination returns 422', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'traslado',
            'discharge_diagnosis' => 'Fractura de fémur',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['destination']);
});

test('missing discharge_diagnosis returns 422', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['discharge_diagnosis']);
});

// ─── Authorization ────────────────────────────────────────────────────────────

test('doctor from different turn gets 403', function () {
    $otherUser = User::factory()->create();
    $otherUser->assignRole('medico');
    $otherDoctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $otherUser->id,
        'is_active' => true,
    ]);

    $this->actingAs($otherUser)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Gripe',
        ])
        ->assertForbidden();
});

// ─── Unique constraint ────────────────────────────────────────────────────────

test('turn cannot have two discharges returns 422', function () {
    // First discharge
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Gripe resuelta',
        ])
        ->assertRedirect();

    // Reset turn status to allow second attempt
    $this->turn->update(['status' => 'en_consulta']);

    // Second discharge attempt → 422 with message
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Gripe resuelta de nuevo',
        ])
        ->assertUnprocessable()
        ->assertJson(['message' => 'Este turno ya tiene un alta registrada.']);
});

// ─── Old PATCH route is gone (405) ───────────────────────────────────────────

test('PATCH /consulta/turnos/{turn}/alta returns 405 (route removed)', function () {
    $this->actingAs($this->user)
        ->patch("/consulta/turnos/{$this->turn->id}/alta")
        ->assertStatus(405);
});
