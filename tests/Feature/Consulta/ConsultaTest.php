<?php

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\PatientAntecedent;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('module.consulta.access');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
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
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
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
    ]);

    $this->actingAs($this->user)
        ->post('/consulta', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'turn_id' => $turn->id,
            'motivo_consulta' => 'Control',
        ])
        ->assertRedirect();

    expect($turn->fresh()->status)->toBe('en_consulta');
});

test('store consultation without turn_id still works', function () {
    $this->actingAs($this->user)
        ->post('/consulta', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'motivo_consulta' => 'Consulta espontánea',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('consultations', [
        'patient_id' => $this->patient->id,
        'turn_id' => null,
    ]);
});

test('store consultation validates required fields', function () {
    $this->actingAs($this->user)
        ->post('/consulta', [])
        ->assertSessionHasErrors(['patient_id', 'doctor_id']);
});

test('unauthorized user gets 403 on POST /consulta', function () {
    $noPerms = User::factory()->create();
    $this->actingAs($noPerms)
        ->post('/consulta', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
        ])
        ->assertForbidden();
});

test('store consultation redirects with flash success', function () {
    $this->actingAs($this->user)
        ->post('/consulta', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'motivo_consulta' => 'Revisión',
        ])
        ->assertRedirect()
        ->assertSessionHas('flash');
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
});

test('antecedents upsert: updating twice keeps one record', function () {
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

// ─── Alta ─────────────────────────────────────────────────────────────────────

test('authorized user can give alta and turn becomes atendido', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
    ]);

    $this->actingAs($this->user)
        ->patch("/consulta/turnos/{$turn->id}/alta")
        ->assertRedirect(route('consulta'));

    expect($turn->fresh()->status)->toBe('atendido');
});

test('alta redirects with flash success', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
    ]);

    $this->actingAs($this->user)
        ->patch("/consulta/turnos/{$turn->id}/alta")
        ->assertRedirect()
        ->assertSessionHas('flash');
});

test('unauthorized user gets 403 on PATCH /consulta/turnos/{turn}/alta', function () {
    $noPerms = User::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
    ]);

    $this->actingAs($noPerms)
        ->patch("/consulta/turnos/{$turn->id}/alta")
        ->assertForbidden();
});
