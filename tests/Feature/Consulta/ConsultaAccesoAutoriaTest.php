<?php

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a user with role medico and a linked active doctor.
 *
 * @return array{user: User, doctor: Doctor}
 */
function makeDoctor(?Specialty $specialty = null): array
{
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty ??= Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'user_id' => $user->id,
        'specialty_id' => $specialty->id,
        'is_active' => true,
    ]);

    return ['user' => $user, 'doctor' => $doctor];
}

// ─── Admin WITHOUT doctor: blocked from all /consulta endpoints ──────────────

test('admin without linked doctor gets 403 on GET /consulta', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $this->actingAs($admin)->get('/consulta')->assertForbidden();
});

test('admin without linked doctor gets 403 on POST /consulta', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $patient = Patient::factory()->create();
    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id]);
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'motivo_consulta' => 'Test',
        ])
        ->assertForbidden();
});

test('admin without linked doctor gets 403 on alta', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id]);
    $patient = Patient::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
    ]);

    $this->actingAs($admin)
        ->patch("/consulta/turnos/{$turn->id}/alta")
        ->assertForbidden();
});

test('admin without linked doctor gets 403 on antecedentes', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $patient = Patient::factory()->create();

    $this->actingAs($admin)
        ->patch("/consulta/antecedentes/{$patient->id}", ['personales' => 'HTA'])
        ->assertForbidden();
});

test('admin without linked doctor does not have consulta in permissions', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $this->actingAs($admin)
        ->get('/tablero')
        ->assertInertia(fn ($page) => $page
            ->where('permissions', fn ($perms) => ! in_array('module.consulta.access', (array) $perms))
        );
});

// ─── Owner (admin + linked active doctor): full access ───────────────────────

test('owner (admin + active doctor) can access GET /consulta', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');
    $admin->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'user_id' => $admin->id,
        'specialty_id' => $specialty->id,
        'is_active' => true,
    ]);

    $this->actingAs($admin)->get('/consulta')->assertOk();
});

test('owner can store a consultation for their own turn', function () {
    $admin = User::factory()->create();
    $admin->assignRole('administrador');
    $admin->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'user_id' => $admin->id,
        'specialty_id' => $specialty->id,
        'is_active' => true,
    ]);
    $patient = Patient::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($admin)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'motivo_consulta' => 'Control',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('consultations', [
        'turn_id' => $turn->id,
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
    ]);
});

// ─── Doctor A cannot act on Doctor B's turns ─────────────────────────────────

test('doctor A gets 403 on POST /consulta with a turn belonging to doctor B', function () {
    $specialtyA = Specialty::factory()->create();
    $specialtyB = Specialty::factory()->create();

    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor($specialtyA);
    ['user' => $userB, 'doctor' => $doctorB] = makeDoctor($specialtyB);

    $patient = Patient::factory()->create();
    $turnB = Turn::factory()->create([
        'doctor_id' => $doctorB->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($userA)
        ->post('/consulta', [
            'turn_id' => $turnB->id,
            'motivo_consulta' => 'Intruso',
        ])
        ->assertForbidden();
});

test('doctor A gets 403 on alta for a turn belonging to doctor B', function () {
    $specialtyA = Specialty::factory()->create();
    $specialtyB = Specialty::factory()->create();

    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor($specialtyA);
    ['user' => $userB, 'doctor' => $doctorB] = makeDoctor($specialtyB);

    $patient = Patient::factory()->create();
    $turnB = Turn::factory()->create([
        'doctor_id' => $doctorB->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($userA)
        ->patch("/consulta/turnos/{$turnB->id}/alta")
        ->assertForbidden();
});

// ─── doctor_id is always taken from the turn, not from request ───────────────

test('even if request sends another doctor_id, consultation is saved with turn doctor_id', function () {
    $specialtyA = Specialty::factory()->create();
    $specialtyB = Specialty::factory()->create();

    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor($specialtyA);
    ['user' => $userB, 'doctor' => $doctorB] = makeDoctor($specialtyB);

    $patient = Patient::factory()->create();
    $turnA = Turn::factory()->create([
        'doctor_id' => $doctorA->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    // UserA sends doctorB's id in the request — should be ignored
    $this->actingAs($userA)
        ->post('/consulta', [
            'turn_id' => $turnA->id,
            'doctor_id' => $doctorB->id,
            'motivo_consulta' => 'Test',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('consultations', [
        'turn_id' => $turnA->id,
        'doctor_id' => $doctorA->id,
    ]);
});

// ─── created_by is set to authenticated user ─────────────────────────────────

test('created_by is set to the authenticated user id', function () {
    ['user' => $user, 'doctor' => $doctor] = makeDoctor();

    $patient = Patient::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($user)
        ->post('/consulta', [
            'turn_id' => $turn->id,
            'motivo_consulta' => 'Control',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('consultations', [
        'turn_id' => $turn->id,
        'created_by' => $user->id,
    ]);
});

// ─── Each doctor sees only their own queue ────────────────────────────────────

test('index returns only the authenticated doctor own queue', function () {
    $specialtyA = Specialty::factory()->create();
    $specialtyB = Specialty::factory()->create();

    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor($specialtyA);
    ['user' => $userB, 'doctor' => $doctorB] = makeDoctor($specialtyB);

    $patient = Patient::factory()->create();

    Turn::factory()->create([
        'doctor_id' => $doctorA->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    Turn::factory()->create([
        'doctor_id' => $doctorB->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($userA)
        ->get('/consulta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('turns_en_consulta', 1)
            ->where('turns_en_consulta.0.doctor.id', $doctorA->id)
        );
});

// ─── Patient with turns to multiple doctors on same day ──────────────────────

test('patient with turns to A and B on same day: each doctor saves their own consultation', function () {
    $specialtyA = Specialty::factory()->create();
    $specialtyB = Specialty::factory()->create();

    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor($specialtyA);
    ['user' => $userB, 'doctor' => $doctorB] = makeDoctor($specialtyB);

    $patient = Patient::factory()->create();

    $turnA = Turn::factory()->create([
        'doctor_id' => $doctorA->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $turnB = Turn::factory()->create([
        'doctor_id' => $doctorB->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    // Doctor A saves
    $this->actingAs($userA)
        ->post('/consulta', ['turn_id' => $turnA->id, 'motivo_consulta' => 'Por A'])
        ->assertRedirect();

    // Doctor B saves
    $this->actingAs($userB)
        ->post('/consulta', ['turn_id' => $turnB->id, 'motivo_consulta' => 'Por B'])
        ->assertRedirect();

    expect(Consultation::where('patient_id', $patient->id)->count())->toBe(2);

    $this->assertDatabaseHas('consultations', [
        'patient_id' => $patient->id,
        'doctor_id' => $doctorA->id,
        'turn_id' => $turnA->id,
    ]);

    $this->assertDatabaseHas('consultations', [
        'patient_id' => $patient->id,
        'doctor_id' => $doctorB->id,
        'turn_id' => $turnB->id,
    ]);
});

// ─── Medico without linked doctor: sees empty state, cannot save ──────────────

test('medico without linked doctor gets 200 on GET /consulta with can_attend false', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');
    // No doctor linked

    $this->actingAs($user)
        ->get('/consulta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/index')
            ->where('can_attend', false)
            ->has('turns_en_consulta', 0)
            ->has('turns_en_espera', 0)
        );
});

test('medico without linked doctor gets 403 on POST /consulta', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id]);
    $patient = Patient::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($user)
        ->post('/consulta', ['turn_id' => $turn->id, 'motivo_consulta' => 'Test'])
        ->assertForbidden();
});

test('medico with inactive doctor gets 200 on GET /consulta with can_attend false', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    Doctor::factory()->create([
        'user_id' => $user->id,
        'specialty_id' => $specialty->id,
        'is_active' => false,
    ]);

    $this->actingAs($user)
        ->get('/consulta')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('consulta/index')
            ->where('can_attend', false)
        );
});

test('medico with inactive doctor gets 403 on POST /consulta', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'user_id' => $user->id,
        'specialty_id' => $specialty->id,
        'is_active' => false,
    ]);
    $patient = Patient::factory()->create();
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($user)
        ->post('/consulta', ['turn_id' => $turn->id, 'motivo_consulta' => 'Test'])
        ->assertForbidden();
});

// ─── History returns consultations from ALL doctors for that patient ──────────

test('historial shows consultations from all doctors for that patient', function () {
    $specialtyA = Specialty::factory()->create();
    $specialtyB = Specialty::factory()->create();

    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor($specialtyA);
    ['doctor' => $doctorB] = makeDoctor($specialtyB);

    $patient = Patient::factory()->create();

    Consultation::factory()->create(['patient_id' => $patient->id, 'doctor_id' => $doctorA->id]);
    Consultation::factory()->create(['patient_id' => $patient->id, 'doctor_id' => $doctorB->id]);

    $this->actingAs($userA)
        ->get("/consulta?patient_id={$patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('historial', 2)
        );
});

// ─── Antecedents: only the turn's doctor can update ──────────────────────────

test('doctor A can update antecedents for a patient they have an open turn for today', function () {
    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor();

    $patient = Patient::factory()->create();
    Turn::factory()->create([
        'doctor_id' => $doctorA->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($userA)
        ->patch("/consulta/antecedentes/{$patient->id}", ['personales' => 'DM2'])
        ->assertRedirect();

    $this->assertDatabaseHas('patient_antecedents', [
        'patient_id' => $patient->id,
        'personales' => 'DM2',
    ]);
});

test('doctor A gets 403 on antecedentes for a patient that belongs to doctor B today', function () {
    $specialtyA = Specialty::factory()->create();
    $specialtyB = Specialty::factory()->create();

    ['user' => $userA, 'doctor' => $doctorA] = makeDoctor($specialtyA);
    ['user' => $userB, 'doctor' => $doctorB] = makeDoctor($specialtyB);

    $patient = Patient::factory()->create();
    // Only doctor B has a turn for this patient today
    Turn::factory()->create([
        'doctor_id' => $doctorB->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    $this->actingAs($userA)
        ->patch("/consulta/antecedentes/{$patient->id}", ['personales' => 'HTA'])
        ->assertForbidden();
});
