<?php

use App\Models\Discharge;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
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
    $this->patient = Patient::factory()->create(['allergies' => 'Penicilina, ibuprofeno']);

    $this->turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);
});

// ─── Create ───────────────────────────────────────────────────────────────────

test('create prescription for turn returns 201', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/receta", [
            'general_instructions' => 'Tomar con agua.',
            'items' => [
                [
                    'position' => 1,
                    'medication' => 'Amoxicilina 500mg',
                    'route' => 'oral',
                    'dose' => '1 cápsula',
                    'frequency' => 'Cada 8 horas',
                    'duration_days' => 7,
                    'is_continuous' => false,
                    'quantity' => 21,
                ],
            ],
        ])
        ->assertCreated();

    expect(Prescription::where('turn_id', $this->turn->id)->count())->toBe(1);
    expect(Prescription::first()->items->count())->toBe(1);
});

// ─── Edit ─────────────────────────────────────────────────────────────────────

test('edit prescription for same turn updates correctly', function () {
    $prescription = Prescription::create([
        'turn_id' => $this->turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id,
        'prescribed_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->putJson("/consulta/turnos/{$this->turn->id}/receta", [
            'general_instructions' => 'Actualizado.',
            'items' => [
                [
                    'position' => 1,
                    'medication' => 'Metronidazol 500mg',
                    'route' => 'oral',
                    'dose' => '1 tableta',
                    'frequency' => 'Cada 12 horas',
                    'duration_days' => 5,
                    'is_continuous' => false,
                    'quantity' => 10,
                ],
            ],
        ])
        ->assertOk();

    $prescription->refresh();
    expect($prescription->general_instructions)->toBe('Actualizado.');
    expect($prescription->items->first()->medication)->toBe('Metronidazol 500mg');
});

// ─── Discharge lock ───────────────────────────────────────────────────────────

test('edit after discharge returns 403', function () {
    $prescription = Prescription::create([
        'turn_id' => $this->turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id,
        'prescribed_at' => now(),
    ]);

    Discharge::create([
        'turn_id' => $this->turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'type' => 'recuperado',
        'discharge_diagnosis' => 'Control sin novedad',
        'created_by' => $this->user->id,
    ]);
    $this->turn->update(['status' => 'atendido']);

    $this->actingAs($this->user)
        ->putJson("/consulta/turnos/{$this->turn->id}/receta", [
            'items' => [],
        ])
        ->assertForbidden();
});

// ─── Authorization ────────────────────────────────────────────────────────────

test('doctor from different turn gets 403 on create', function () {
    $otherUser = User::factory()->create();
    $otherUser->assignRole('medico');
    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $otherUser->id,
        'is_active' => true,
    ]);

    $this->actingAs($otherUser)
        ->postJson("/consulta/turnos/{$this->turn->id}/receta", [
            'items' => [],
        ])
        ->assertForbidden();
});

// ─── Allergy blocking ─────────────────────────────────────────────────────────

test('medication matching allergy returns 422', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/receta", [
            'items' => [
                [
                    'position' => 1,
                    'medication' => 'Ibuprofeno 400mg',
                    'route' => 'oral',
                    'dose' => '1 tableta',
                    'frequency' => 'Cada 8 horas',
                    'duration_days' => 3,
                    'is_continuous' => false,
                    'quantity' => 9,
                ],
            ],
        ])
        ->assertUnprocessable()
        ->assertJsonPath('errors.allergy.1', 'Ibuprofeno 400mg');
});

// ─── Validation ───────────────────────────────────────────────────────────────

test('duration_days missing when is_continuous is false returns 422', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/receta", [
            'items' => [
                [
                    'position' => 1,
                    'medication' => 'Amoxicilina 500mg',
                    'route' => 'oral',
                    'dose' => '1 cápsula',
                    'frequency' => 'Cada 8 horas',
                    'is_continuous' => false,
                    'quantity' => 21,
                ],
            ],
        ])
        ->assertUnprocessable();
});

test('duration_days not required when is_continuous is true', function () {
    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/receta", [
            'items' => [
                [
                    'position' => 1,
                    'medication' => 'Omeprazol 20mg',
                    'route' => 'oral',
                    'dose' => '1 cápsula',
                    'frequency' => 'Cada 24 horas',
                    'is_continuous' => true,
                    'quantity' => 30,
                ],
            ],
        ])
        ->assertCreated();
});

test('two prescriptions for same turn returns 422', function () {
    Prescription::create([
        'turn_id' => $this->turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id,
        'prescribed_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$this->turn->id}/receta", [
            'items' => [
                [
                    'position' => 1,
                    'medication' => 'Amoxicilina 500mg',
                    'route' => 'oral',
                    'dose' => '1 cápsula',
                    'frequency' => 'Cada 8 horas',
                    'duration_days' => 7,
                    'is_continuous' => false,
                    'quantity' => 21,
                ],
            ],
        ])
        ->assertUnprocessable();
});

// ─── Print route ──────────────────────────────────────────────────────────────

test('print route returns correct data', function () {
    $prescription = Prescription::create([
        'turn_id' => $this->turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'general_instructions' => 'Descanso relativo.',
        'created_by' => $this->user->id,
        'prescribed_at' => now(),
    ]);

    $prescription->items()->create([
        'position' => 1,
        'medication' => 'Amoxicilina 500mg',
        'route' => 'oral',
        'dose' => '1 cápsula',
        'frequency' => 'Cada 8 horas',
        'duration_days' => 7,
        'is_continuous' => false,
        'quantity' => 21,
    ]);

    $this->actingAs($this->user)
        ->get("/consulta/recetas/{$prescription->id}/imprimir")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/receta-imprimir')
            ->has('prescription')
            ->where('prescription.id', $prescription->id)
            ->where('prescription.general_instructions', 'Descanso relativo.')
        );
});

test('medico without active doctor gets 403 on print route', function () {
    $prescription = Prescription::create([
        'turn_id' => $this->turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id,
        'prescribed_at' => now(),
    ]);

    // Create a medico user WITHOUT an active doctor
    $userNoDoctor = User::factory()->create();
    $userNoDoctor->assignRole('medico');

    $this->actingAs($userNoDoctor)
        ->get("/consulta/recetas/{$prescription->id}/imprimir")
        ->assertForbidden();
});
