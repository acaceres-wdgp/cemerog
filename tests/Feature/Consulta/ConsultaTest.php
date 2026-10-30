<?php

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientAntecedent;
use App\Models\Prescription;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    // A medico with an active linked doctor – satisfies attend-patients middleware
    $this->user = User::factory()->create();
    $this->user->assignRole('medico');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $this->user->id,
        'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();
});

// ─── Index ────────────────────────────────────────────────────────────────────

test('authorized user can GET /consulta and receives required props', function () {
    $this->actingAs($this->user)
        ->get('/consulta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/index')
            ->has('turns_en_consulta')
            ->has('turns_en_espera')
        );
});

test('unauthenticated user is redirected from /consulta', function () {
    $this->get('/consulta')->assertRedirect('/login');
});

test('user without permission gets 403 on GET /consulta', function () {
    $noPerms = User::factory()->create();
    $this->actingAs($noPerms)->get('/consulta')->assertForbidden();
});

test('index includes turns in en_consulta with patient and doctor data', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->get('/consulta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/index')
            ->has('turns_en_consulta', 1)
            ->where('turns_en_consulta.0.doctor.full_name', $this->doctor->name)
            ->where('turns_en_consulta.0.doctor.specialty', 'Medicina General')
        );
});

test('index only includes today turns', function () {
    Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now()->subDay(),
    ]);

    $this->actingAs($this->user)
        ->get('/consulta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/index')
            ->has('turns_en_consulta', 0)
        );
});

// ─── Store Consultation ───────────────────────────────────────────────────────

test('authorized user can store a consultation', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'motivo_consulta' => 'Dolor de cabeza',
            'diagnosticos' => [['code' => 'R51', 'label' => 'Cefalea']],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('consultations', [
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'turn_id' => $turn->id,
        'motivo_consulta' => 'Dolor de cabeza',
    ]);
});

test('store consultation does NOT auto-mark turn as atendido', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'motivo_consulta' => 'Control',
        ])
        ->assertRedirect();

    expect($turn->fresh()->status)->toBe('en_consulta');
});

test('store consultation without turn_id returns 403 (turn ownership check fails)', function () {
    // With the new business rule, turn_id is required for authorization.
    // Without it authorize() returns false → 403, before validation runs.
    $this->actingAs($this->user)
        ->post('/consulta', [])
        ->assertForbidden();
});

test('unauthorized user gets 403 on POST /consulta', function () {
    $noPerms = User::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);
    $this->actingAs($noPerms)
        ->post('/consulta', [
            'turn_id' => $turn->id,
        ])
        ->assertForbidden();
});

test('store consultation redirects with flash success', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'motivo_consulta' => 'Revisión',
        ])
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Consulta guardada exitosamente.');
});

// ─── Historial ────────────────────────────────────────────────────────────────

test('index loads historial when patient_id is provided', function () {
    Consultation::factory()->count(3)->create([
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
    ]);

    $this->actingAs($this->user)
        ->get("/consulta?patient_id={$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/index')
            ->has('historial', 3)
            ->where('historial.0.doctor.full_name', $this->doctor->name)
            ->where('historial.0.doctor.specialty', 'Medicina General')
            ->has('historial_patient')
        );
});

// ─── Antecedentes ─────────────────────────────────────────────────────────────

test('authorized user can update patient antecedents', function () {
    // Doctor needs an open turn for the patient today
    Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->patch("/consulta/antecedentes/{$this->patient->id}", [
            'personales' => 'HTA, DM2',
            'quirurgicos' => 'Apendicectomía 2010',
            'medicamentos' => 'Metformina 850mg',
            'familiares' => 'Padre HTA',
            'alergias' => 'Penicilina',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('patient_antecedents', [
        'patient_id' => $this->patient->id,
        'personales' => 'HTA, DM2',
        'alergias' => 'Penicilina',
    ]);

    expect(session('inertia.flash_data.toast.type'))->toBe('success');
    expect(session('inertia.flash_data.toast.message'))->toBe('Antecedentes actualizados.');
});

test('antecedents upsert: updating twice keeps one record', function () {
    Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->patch("/consulta/antecedentes/{$this->patient->id}", ['personales' => 'HTA']);

    $this->actingAs($this->user)
        ->patch("/consulta/antecedentes/{$this->patient->id}", ['personales' => 'HTA, DM2']);

    expect(PatientAntecedent::where('patient_id', $this->patient->id)->count())->toBe(1);
    expect(PatientAntecedent::where('patient_id', $this->patient->id)->value('personales'))->toBe('HTA, DM2');
});

test('unauthorized user gets 403 on PATCH /consulta/antecedentes/{patient}', function () {
    $noPerms = User::factory()->create();
    $this->actingAs($noPerms)
        ->patch("/consulta/antecedentes/{$this->patient->id}", ['personales' => 'HTA'])
        ->assertForbidden();
});

// ─── Alta (discharge) ─────────────────────────────────────────────────────────

test('authorized user can give alta and turn becomes atendido', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Control sin novedad',
        ])
        ->assertRedirect(route('consulta'));

    expect($turn->fresh()->status)->toBe('atendido');
});

test('alta redirects with flash success', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Control sin novedad',
        ])
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Paciente dado de alta.');
});

test('unauthorized user gets 403 on POST /consulta/turnos/{turn}/alta', function () {
    $noPerms = User::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
    ]);

    $this->actingAs($noPerms)
        ->postJson("/consulta/turnos/{$turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Control',
        ])
        ->assertForbidden();
});

test('alta of a turn from yesterday returns 403', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now()->subDay(),
    ]);

    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Control',
        ])
        ->assertForbidden();
});

test('alta of an already atendido turn returns 403', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'atendido',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson("/consulta/turnos/{$turn->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Control',
        ])
        ->assertForbidden();
});

// ─── Validation range tests ───────────────────────────────────────────────────

test('talla=400 (above max) returns 422', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson('/consulta', [
            'turn_id' => $turn->id,
            'talla' => 400,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['talla']);
});

test('peso=5000 (above max) returns 422', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson('/consulta', [
            'turn_id' => $turn->id,
            'peso' => 5000,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['peso']);
});

test('talla=30 (lower bound) saves OK', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'talla' => 30,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});

test('talla=241 (upper bound) saves OK', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'talla' => 241,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});

test('peso=9 (lower bound) saves OK', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'peso' => 9,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});

test('peso=3175 (upper bound) saves OK', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'peso' => 3175,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});

// ─── Prescriptions prop ───────────────────────────────────────────────────────

test('GET /consulta includes prescriptions prop indexed by turn_id', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $prescription = Prescription::create([
        'turn_id' => $turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id,
        'prescribed_at' => now(),
        'general_instructions' => 'Reposo.',
    ]);

    $prescription->items()->create([
        'position' => 1,
        'medication' => 'Paracetamol 500mg',
        'dose' => '1 tableta',
        'frequency' => 'Cada 6 horas',
        'duration_days' => 3,
        'is_continuous' => false,
        'quantity' => 12,
    ]);

    $this->actingAs($this->user)
        ->get('/consulta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/index')
            ->has('prescriptions')
            ->has("prescriptions.{$turn->id}")
            ->where("prescriptions.{$turn->id}.id", $prescription->id)
            ->where("prescriptions.{$turn->id}.general_instructions", 'Reposo.')
            ->has("prescriptions.{$turn->id}.items", 1)
        );
});

test('saving twice (create then update) leaves one prescription with new items', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $item = [
        'position' => 1,
        'medication' => 'Amoxicilina 500mg',
        'route' => 'oral',
        'dose' => '1 cápsula',
        'frequency' => 'Cada 8 horas',
        'duration_days' => 7,
        'is_continuous' => false,
        'quantity' => 21,
    ];

    // First save → creates prescription, redirects back
    $this->actingAs($this->user)
        ->post("/consulta/turnos/{$turn->id}/receta", [
            'general_instructions' => 'Tomar con agua.',
            'items' => [$item],
        ])
        ->assertRedirect();

    expect(Prescription::where('turn_id', $turn->id)->count())->toBe(1);

    // Second save → updates same prescription
    $this->actingAs($this->user)
        ->put("/consulta/turnos/{$turn->id}/receta", [
            'general_instructions' => 'Actualizado.',
            'items' => [array_merge($item, ['medication' => 'Metronidazol 500mg', 'duration_days' => 5, 'quantity' => 10])],
        ])
        ->assertRedirect();

    expect(Prescription::where('turn_id', $turn->id)->count())->toBe(1);
    expect(Prescription::where('turn_id', $turn->id)->first()->general_instructions)->toBe('Actualizado.');
    expect(Prescription::where('turn_id', $turn->id)->first()->items->first()->medication)->toBe('Metronidazol 500mg');
});
