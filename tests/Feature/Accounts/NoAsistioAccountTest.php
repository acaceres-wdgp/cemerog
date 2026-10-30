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
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');

    $this->tablero = User::factory()->create();
    $this->tablero->givePermissionTo('module.tablero.access');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctorA = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'is_active' => true,
        'consultation_price' => 200000,
        'consultation_fee' => 30000,
    ]);

    $this->patient = Patient::factory()->create();
});

// ─── NA1: single turn → no_asistio → account anulada, no charges ─────────────

test('marking the only turn no_asistio removes its charge and annuls the account', function () {
    // Register arrival (creates account + charge)
    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $this->patient->id,
            'first_names' => $this->patient->first_names,
            'last_names' => $this->patient->last_names,
            'document_type' => $this->patient->document_type,
            'document_number' => $this->patient->document_number,
            'birth_date' => $this->patient->birth_date->format('Y-m-d'),
            'sex' => $this->patient->sex,
            'phone' => $this->patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctorA->id,
        ])
        ->assertRedirect('/tablero');

    $turn = Turn::where('patient_id', $this->patient->id)->firstOrFail();
    expect(AccountCharge::count())->toBe(1);

    // Mark no_asistio
    $this->actingAs($this->tablero)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'no_asistio'])
        ->assertRedirect('/tablero');

    expect(AccountCharge::count())->toBe(0);

    $account = Account::where('patient_id', $this->patient->id)->firstOrFail();
    expect($account->status)->toBe('anulada');
    expect($account->closed_at)->not->toBeNull();
});

// ─── NA2: two turns, one no_asistio, one discharged → pendiente_facturar ──────

test('with two turns, marking one no_asistio and discharging the other leaves one charge and pendiente_facturar', function () {
    $specialtyB = Specialty::factory()->create(['name' => 'Cardiología']);
    $doctorB = Doctor::factory()->create([
        'specialty_id' => $specialtyB->id,
        'is_active' => true,
        'consultation_price' => 300000,
        'consultation_fee' => 50000,
    ]);

    // Register both arrivals
    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $this->patient->id,
            'first_names' => $this->patient->first_names,
            'last_names' => $this->patient->last_names,
            'document_type' => $this->patient->document_type,
            'document_number' => $this->patient->document_number,
            'birth_date' => $this->patient->birth_date->format('Y-m-d'),
            'sex' => $this->patient->sex,
            'phone' => $this->patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctorA->id,
        ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $this->patient->id,
            'first_names' => $this->patient->first_names,
            'last_names' => $this->patient->last_names,
            'document_type' => $this->patient->document_type,
            'document_number' => $this->patient->document_number,
            'birth_date' => $this->patient->birth_date->format('Y-m-d'),
            'sex' => $this->patient->sex,
            'phone' => $this->patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $doctorB->id,
        ]);

    expect(AccountCharge::count())->toBe(2);

    // Mark doctorA's turn no_asistio
    $turnA = Turn::where('patient_id', $this->patient->id)
        ->where('doctor_id', $this->doctorA->id)
        ->firstOrFail();

    $this->actingAs($this->tablero)
        ->patch("/tablero/turnos/{$turnA->id}/status", ['status' => 'no_asistio'])
        ->assertRedirect('/tablero');

    // One charge remains (doctorB's), account still abierta
    expect(AccountCharge::count())->toBe(1);
    $account = Account::where('patient_id', $this->patient->id)->firstOrFail();
    expect($account->status)->toBe('abierta');

    // Now discharge doctorB's turn
    $turnB = Turn::where('patient_id', $this->patient->id)
        ->where('doctor_id', $doctorB->id)
        ->firstOrFail();

    $turnB->update(['status' => 'en_consulta']);

    $doctorBUser = User::factory()->create();
    $doctorBUser->givePermissionTo('module.consulta.access');
    $doctorBUser->assignRole('medico');
    $doctorB->update(['user_id' => $doctorBUser->id]);

    $this->actingAs($doctorBUser)
        ->post("/consulta/turnos/{$turnB->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Hipertensión controlada',
        ])
        ->assertRedirect(route('consulta'));

    $account->refresh();
    expect($account->status)->toBe('pendiente_facturar');
    expect(AccountCharge::count())->toBe(1);
});

// ─── NA3: no_asistio with another open turn → account stays abierta ──────────

test('marking a turn no_asistio with another open turn leaves the account abierta', function () {
    $specialtyB = Specialty::factory()->create(['name' => 'Cardiología']);
    $doctorB = Doctor::factory()->create([
        'specialty_id' => $specialtyB->id,
        'is_active' => true,
        'consultation_price' => 300000,
        'consultation_fee' => 50000,
    ]);

    // Register both arrivals
    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $this->patient->id,
            'first_names' => $this->patient->first_names,
            'last_names' => $this->patient->last_names,
            'document_type' => $this->patient->document_type,
            'document_number' => $this->patient->document_number,
            'birth_date' => $this->patient->birth_date->format('Y-m-d'),
            'sex' => $this->patient->sex,
            'phone' => $this->patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctorA->id,
        ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $this->patient->id,
            'first_names' => $this->patient->first_names,
            'last_names' => $this->patient->last_names,
            'document_type' => $this->patient->document_type,
            'document_number' => $this->patient->document_number,
            'birth_date' => $this->patient->birth_date->format('Y-m-d'),
            'sex' => $this->patient->sex,
            'phone' => $this->patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $doctorB->id,
        ]);

    // Mark doctorA no_asistio — doctorB still open
    $turnA = Turn::where('patient_id', $this->patient->id)
        ->where('doctor_id', $this->doctorA->id)
        ->firstOrFail();

    $this->actingAs($this->tablero)
        ->patch("/tablero/turnos/{$turnA->id}/status", ['status' => 'no_asistio'])
        ->assertRedirect('/tablero');

    $account = Account::where('patient_id', $this->patient->id)->firstOrFail();
    expect($account->status)->toBe('abierta');
    expect(AccountCharge::count())->toBe(1); // doctorB's charge remains
});
