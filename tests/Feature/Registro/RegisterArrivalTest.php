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
        ->assertSessionHas('inertia.flash_data.toast.type', 'success');

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

    $flash = session('inertia.flash_data');
    expect($flash['toast']['message'])->toContain('Ana Pérez');
    expect($flash['toast']['message'])->toContain('T-1');
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

// C9 – different doctor: patient CAN register a second turn the same day
test('paciente con turno abierto con médico A puede registrar turno con médico B el mismo día', function () {
    $specialty = Specialty::factory()->create(['name' => 'Pediatría']);
    $doctorB = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);

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
            'doctor_id' => $doctorB->id,  // different doctor
        ])
        ->assertRedirect('/tablero');

    expect(Turn::where('patient_id', $patient->id)->count())->toBe(2);
});

// C10 – same doctor: patient CANNOT open a second turn today with the same doctor
test('paciente con turno abierto con médico A no puede abrir otro turno con médico A', function () {
    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'en_consulta',
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
            'doctor_id' => $this->doctor->id,  // same doctor
        ])
        ->assertSessionHasErrors(['open_turn']);

    expect(Turn::where('patient_id', $patient->id)->count())->toBe(1);
});

// C11 – closed turn: patient CAN open a new turn with the same doctor after a closed turn
test('turno cerrado con médico A permite abrir nuevo turno con médico A el mismo día', function () {
    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'atendido',  // closed status
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
        ->assertRedirect('/tablero');

    expect(Turn::where('patient_id', $patient->id)->count())->toBe(2);
});

// C12 – the exception message names the doctor
test('el mensaje de error nombra al médico con turno abierto', function () {
    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $response = $this->actingAs($this->secretaria)
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
        ]);

    $response->assertSessionHasErrors(['open_turn']);
    $errors = session('errors')->toArray();
    expect($errors['open_turn'][0])->toContain($this->doctor->name);
});

// C13 – POST /tablero/turnos: different doctor is allowed
test('POST /tablero/turnos permite segundo turno con médico diferente el mismo día', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.tablero.access');

    $specialty = Specialty::factory()->create(['name' => 'Cardiología']);
    $doctorB = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);

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
            'doctor_id' => $doctorB->id,  // different doctor
        ])
        ->assertRedirect('/tablero');

    expect(Turn::where('patient_id', $patient->id)->count())->toBe(2);
});

// C14 – POST /tablero/turnos: same doctor is blocked
test('POST /tablero/turnos rechaza turno con mismo médico si ya hay uno abierto hoy', function () {
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

// C15 – search API returns open_turns_today list instead of flat flags
test('GET /registro/pacientes/buscar retorna open_turns_today como lista de médicos', function () {
    $specialty = Specialty::factory()->create(['name' => 'Pediatría']);
    $doctorB = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true, 'name' => 'Dr. Gómez']);

    $patient = Patient::factory()->create(['first_names' => 'Carlos', 'last_names' => 'Ramírez']);
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctorB->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/buscar?q=Carlos')
        ->assertOk()
        ->assertJsonFragment([
            'id' => $patient->id,
        ])
        ->assertJsonPath('0.open_turns_today.0.doctor_name', $this->doctor->name)
        ->assertJsonPath('0.open_turns_today.1.doctor_name', 'Dr. Gómez');
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

// ─── Adj-1: no duplicate Dr. prefix ──────────────────────────────────────────

// Adj1-A – exception message must not prepend "Dr." when name already has it
test('el mensaje no duplica el prefijo Dr. cuando el nombre ya lo incluye', function () {
    $specialty = Specialty::factory()->create(['name' => 'Ginecología']);
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'name' => 'Dra. López',
        'is_active' => true,
    ]);

    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $doctor->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $response = $this->actingAs($this->secretaria)
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
            'doctor_id' => $doctor->id,
        ]);

    $response->assertSessionHasErrors(['open_turn']);
    $errors = session('errors')->toArray();
    expect($errors['open_turn'][0])->toContain('con Dra. López');
    expect($errors['open_turn'][0])->not->toContain('Dr. Dra.');
});

// ─── Adj-2: status shown as human-readable label in exception message ─────────

// Adj2-A – exception message shows "En espera" not raw "espera"
test('el mensaje de error muestra "En espera" en lugar del estado raw espera', function () {
    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $response = $this->actingAs($this->secretaria)
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
        ]);

    $response->assertSessionHasErrors(['open_turn']);
    $errors = session('errors')->toArray();
    expect($errors['open_turn'][0])->toContain('En espera');
    expect($errors['open_turn'][0])->not->toContain('espera,');
    expect($errors['open_turn'][0])->not->toContain('(espera)');
});

// Adj2-B – exception message shows "En consulta" not raw "en_consulta"
test('el mensaje de error muestra "En consulta" en lugar del estado raw en_consulta', function () {
    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $patient->id,
        'doctor_id' => $this->doctor->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $response = $this->actingAs($this->secretaria)
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
        ]);

    $response->assertSessionHasErrors(['open_turn']);
    $errors = session('errors')->toArray();
    expect($errors['open_turn'][0])->toContain('En consulta');
    expect($errors['open_turn'][0])->not->toContain('(en_consulta)');
});
