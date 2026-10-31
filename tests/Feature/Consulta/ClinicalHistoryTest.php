<?php

use App\Actions\BuildClinicalHistory;
use App\Models\Consultation;
use App\Models\Discharge;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctorA = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->doctorB = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->userA = User::factory()->create();
    $this->doctorA->update(['user_id' => $this->userA->id]);
    $this->userA->refresh();
    $this->doctorA->refresh();

    $this->patient = Patient::factory()->create();
    $this->action = app(BuildClinicalHistory::class);
});

// ─── consulta entries ─────────────────────────────────────────────────────────

test('consultation with note appears as consulta entry', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'arrived_at' => now(),
    ]);
    Consultation::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'turn_id' => $turn->id,
        'consulted_at' => now(),
    ]);

    $entries = $this->action->handle($this->patient, $this->doctorA);

    $consultas = collect($entries)->where('type', 'consulta');
    expect($consultas)->toHaveCount(1);
});

// ─── prescription without note → receta entry ────────────────────────────────

test('prescription without consultation note appears as receta entry', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'arrived_at' => now(),
        'status' => 'atendido',
    ]);
    // Prescription but NO consultation note
    $prescription = Prescription::create([
        'turn_id' => $turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctorA->id,
        'general_instructions' => 'Tomar con agua',
        'created_by' => $this->userA->id,
        'prescribed_at' => now(),
    ]);
    PrescriptionItem::create([
        'prescription_id' => $prescription->id,
        'position' => 1,
        'medication' => 'Ibuprofeno',
        'route' => 'oral',
        'dose' => '400mg',
        'frequency' => 'cada 8 horas',
        'duration_days' => 5,
        'is_continuous' => false,
        'quantity' => 15,
    ]);

    $entries = $this->action->handle($this->patient, $this->doctorA);

    $recetas = collect($entries)->where('type', 'receta');
    expect($recetas)->toHaveCount(1);

    // No consulta entry since there's no note
    $consultas = collect($entries)->where('type', 'consulta');
    expect($consultas)->toHaveCount(0);
});

// ─── alta without note → alta entry ──────────────────────────────────────────

test('discharge without consultation note appears as alta entry', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'arrived_at' => now(),
        'status' => 'atendido',
    ]);
    // Discharge but NO consultation
    Discharge::create([
        'turn_id' => $turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctorA->id,
        'type' => 'recuperado',
        'discharge_diagnosis' => 'Gripe resuelta',
        'discharged_at' => now(),
        'created_by' => $this->userA->id,
    ]);

    $entries = $this->action->handle($this->patient, $this->doctorA);

    $altas = collect($entries)->where('type', 'alta');
    expect($altas)->toHaveCount(1);

    // No consulta entry
    $consultas = collect($entries)->where('type', 'consulta');
    expect($consultas)->toHaveCount(0);
});

// ─── mine flag ────────────────────────────────────────────────────────────────

test('mine is true for entries from the callers doctor and false for others', function () {
    $turnA = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'arrived_at' => now()->subHours(2),
        'status' => 'atendido',
    ]);
    Consultation::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'turn_id' => $turnA->id,
        'consulted_at' => now()->subHours(2),
    ]);

    $turnB = Turn::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patient->id,
        'arrived_at' => now()->subHour(),
        'status' => 'atendido',
    ]);
    Consultation::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patient->id,
        'turn_id' => $turnB->id,
        'consulted_at' => now()->subHour(),
    ]);

    $entriesA = $this->action->handle($this->patient, $this->doctorA);
    $mineEntries = collect($entriesA)->where('mine', true);
    $otherEntries = collect($entriesA)->where('mine', false);

    expect($mineEntries)->toHaveCount(1);
    expect($otherEntries)->toHaveCount(1);

    $mineEntry = $mineEntries->first();
    expect($mineEntry['doctor']['id'])->toBe($this->doctorA->id);
});

// ─── ordering ─────────────────────────────────────────────────────────────────

test('entries are ordered from most recent to oldest', function () {
    $old = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'arrived_at' => now()->subDays(2),
        'status' => 'atendido',
    ]);
    Consultation::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'turn_id' => $old->id,
        'consulted_at' => now()->subDays(2),
    ]);

    $newer = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'arrived_at' => now()->subDay(),
        'status' => 'atendido',
    ]);
    Consultation::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'turn_id' => $newer->id,
        'consulted_at' => now()->subDay(),
    ]);

    $entries = $this->action->handle($this->patient, $this->doctorA);

    expect($entries[0]['date'])->toBeGreaterThanOrEqual($entries[1]['date']);
});
