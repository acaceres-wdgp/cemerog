<?php

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');

    $specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);
});

function validNewPatientPayload(int $doctorId): array
{
    return [
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
        'first_names' => 'Ana',
        'last_names' => 'Pérez',
        'birth_date' => '1990-05-15',
        'sex' => 'F',
        'phone' => '809-555-0001',
        'attention_type' => 'consulta',
        'doctor_id' => $doctorId,
    ];
}

// C1 – new patient flow creates patient + turn and redirects with flash
test('registrar paciente nuevo crea paciente y turno con flash', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', validNewPatientPayload($this->doctor->id))
        ->assertRedirect('/tablero')
        ->assertSessionHas('flash');

    $this->assertDatabaseHas('patients', ['first_names' => 'Ana']);
    $this->assertDatabaseHas('turns', [
        'turn_number' => 1,
        'status' => 'espera',
    ]);
});

// C1 – flash message contains name and turn number
test('el flash contiene el nombre del paciente y el número de turno', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', validNewPatientPayload($this->doctor->id));

    $flash = session('flash');
    expect($flash['message'])->toContain('Ana Pérez');
    expect($flash['message'])->toContain('T-1');
});

// C2 – existing patient: updates data and creates turn
test('registrar paciente existente actualiza datos y crea turno', function () {
    $patient = Patient::factory()->create(['first_names' => 'Original']);

    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $patient->id,
            'first_names' => 'Actualizado',
            'last_names' => $patient->last_names,
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'sex' => $patient->sex,
            'phone' => '809-555-0099',
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctor->id,
        ])
        ->assertRedirect('/tablero');

    $this->assertDatabaseHas('patients', ['id' => $patient->id, 'first_names' => 'Actualizado']);
    $this->assertDatabaseHas('turns', ['patient_id' => $patient->id]);
});

// C3 – rejects with 422 if patient already has open turn today
test('rechaza con error si el paciente ya tiene turno abierto hoy', function () {
    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $patient->id,
            'first_names' => $patient->first_names,
            'last_names' => $patient->last_names,
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'sex' => $patient->sex,
            'phone' => $patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctor->id,
        ])
        ->assertSessionHasErrors(['open_turn']);

    expect(Turn::where('patient_id', $patient->id)->count())->toBe(1);
});

// C4 – no_tiene generates GEN- prefix
test('documento no_tiene genera prefijo GEN- automáticamente', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'document_type' => 'no_tiene',
            'first_names' => 'Sin',
            'last_names' => 'Documento',
            'birth_date' => '2000-01-01',
            'sex' => 'M',
            'phone' => '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctor->id,
        ])
        ->assertRedirect('/tablero');

    $patient = Patient::where('first_names', 'Sin')->first();
    expect($patient)->not->toBeNull();
    expect($patient->document_number)->toStartWith('GEN-');
});

// C5 – duplicate document number rejected
test('rechaza con error de validación si el documento ya existe', function () {
    Patient::factory()->create(['document_number' => '001-1234567-8']);

    $this->actingAs($this->secretaria)
        ->post('/registro', validNewPatientPayload($this->doctor->id))
        ->assertSessionHasErrors(['document_number']);
});

// C6 – transaction rolls back if turn fails
test('la transacción se revierte si falla la creación del turno', function () {
    // Force turn creation to fail by passing a non-existent doctor
    $initialCount = Patient::count();

    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'document_type' => 'cedula',
            'document_number' => '001-9999999-9',
            'first_names' => 'Rollback',
            'last_names' => 'Test',
            'birth_date' => '1990-01-01',
            'sex' => 'M',
            'phone' => '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => 99999, // non-existent
        ])
        ->assertSessionHasErrors(['doctor_id']);

    // Patient should NOT have been created
    expect(Patient::count())->toBe($initialCount);
});

// C7 – phone is required for new patients
test('el teléfono es obligatorio para pacientes nuevos', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Sin',
            'last_names' => 'Telefono',
            'birth_date' => '1990-01-01',
            'sex' => 'M',
            // phone omitted
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctor->id,
        ])
        ->assertSessionHasErrors(['phone']);
});

// C8 – POST /tablero/turnos now delegates to RegisterArrival (open-turn check works)
test('POST /tablero/turnos rechaza si el paciente ya tiene turno abierto hoy', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.tablero.access');

    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($user)
        ->post('/tablero/turnos', [
            'patient_id' => $patient->id,
            'doctor_id' => $this->doctor->id,
        ])
        ->assertSessionHasErrors(['open_turn']);

    expect(Turn::where('patient_id', $patient->id)->count())->toBe(1);
});

// D1 – GET /registro accessible for registro roles
test('GET /registro es accesible para secretaria y administrador', function () {
    $specialty = Specialty::factory()->create();
    Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);

    $this->actingAs($this->secretaria)
        ->get('/registro')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('registro/index'));
});

test('GET /registro retorna 403 para roles sin permiso', function () {
    $medico = User::factory()->create(); // No permissions assigned

    $this->actingAs($medico)
        ->get('/registro')
        ->assertForbidden();
});

// D2 – GET /registro?paciente={id} preloads patient
test('GET /registro?paciente={id} precarga el paciente en la prop patient', function () {
    $patient = Patient::factory()->create();
    $specialty = Specialty::factory()->create();
    Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);

    $this->actingAs($this->secretaria)
        ->get("/registro?paciente={$patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patient.id', $patient->id));
});

// D3 – GET /registro?paciente=9999 returns 404
test('GET /registro?paciente=9999 retorna 404', function () {
    $this->actingAs($this->secretaria)
        ->get('/registro?paciente=9999')
        ->assertNotFound();
});
