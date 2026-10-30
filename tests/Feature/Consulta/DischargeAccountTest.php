<?php

use App\Models\Account;
use App\Models\AccountCharge;
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
        'consultation_price' => 200000,
        'consultation_fee' => 30000,
    ]);

    $this->patient = Patient::factory()->create();

    $this->account = Account::create([
        'patient_id' => $this->patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'abierta',
        'opened_at' => now(),
    ]);

    $this->turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    AccountCharge::create([
        'account_id' => $this->account->id,
        'turn_id' => $this->turn->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id,
        'type' => 'consulta',
        'description' => 'Consulta',
        'quantity' => 1,
        'unit_price' => 200000,
        'total' => 200000,
        'doctor_fee' => 30000,
    ]);
});

// ─── D1: Last open turn → account becomes pendiente_facturar ─────────────────

test('discharging the last open turn transitions account to pendiente_facturar', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Resuelto',
        ])
        ->assertRedirect();

    expect($this->account->fresh()->status)->toBe('pendiente_facturar');
});

// ─── D2: Other open turn → account stays abierta ─────────────────────────────

test('discharging one turn while another is still open leaves account abierta', function () {
    // Create a second doctor and turn for the same patient today
    $specialty2 = Specialty::factory()->create(['name' => 'Cardiología']);
    $user2 = User::factory()->create();
    $user2->assignRole('medico');
    $doctor2 = Doctor::factory()->create([
        'specialty_id' => $specialty2->id,
        'user_id' => $user2->id,
        'is_active' => true,
    ]);
    Turn::factory()->create([
        'doctor_id' => $doctor2->id,
        'patient_id' => $this->patient->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Resuelto',
        ])
        ->assertRedirect();

    expect($this->account->fresh()->status)->toBe('abierta');
});

// ─── D3: No account → discharge succeeds without error ───────────────────────

test('discharge works even when no account exists for the patient today', function () {
    $this->account->delete();

    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Resuelto',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});
