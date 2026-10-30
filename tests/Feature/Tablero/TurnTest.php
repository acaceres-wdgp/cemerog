<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->givePermissionTo('module.tablero.access');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->patient = Patient::factory()->create();
});

// ─── Tablero index ────────────────────────────────────────────────────────────

test('authorized user can GET /tablero and receives turns and appointments props', function () {
    $this->actingAs($this->user)
        ->get('/tablero')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tablero/index')
            ->has('turns')
            ->has('appointments')
            ->has('doctors')
            ->has('en_espera')
        );
});

test('unauthenticated user is redirected from /tablero', function () {
    $this->get('/tablero')->assertRedirect('/login');
});

// ─── AssignTurn (walk-in) ─────────────────────────────────────────────────────

test('authorized user can assign a walk-in turn without appointment', function () {
    $this->actingAs($this->user)
        ->post('/tablero/turnos', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'appointment_id' => null,
        ])
        ->assertRedirect(route('tablero'));

    $this->assertDatabaseHas('turns', [
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'appointment_id' => null,
        'turn_number' => 1,
        'turn_order' => 10,
        'status' => 'espera',
    ]);
});

test('authorized user can assign a turn linked to an appointment', function () {
    $appointment = Appointment::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'appointment_date' => now()->toDateString(),
        'status' => 'pendiente',
    ]);

    $this->actingAs($this->user)
        ->post('/tablero/turnos', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'appointment_id' => $appointment->id,
        ])
        ->assertRedirect(route('tablero'));

    $this->assertDatabaseHas('turns', [
        'patient_id' => $this->patient->id,
        'appointment_id' => $appointment->id,
        'turn_number' => 1,
    ]);
});

test('turn_number increments for same doctor on same day', function () {
    Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'turn_number' => 3,
        'turn_order' => 30,
        'arrived_at' => now(),
    ]);

    $patient2 = Patient::factory()->create();
    $this->actingAs($this->user)
        ->post('/tablero/turnos', [
            'patient_id' => $patient2->id,
            'doctor_id' => $this->doctor->id,
        ])
        ->assertRedirect();

    $turn = Turn::where('patient_id', $patient2->id)->first();
    expect($turn->turn_number)->toBe(4);
    expect($turn->turn_order)->toBe(40);
});

test('turn_number resets per day: yesterday turn does not affect today count', function () {
    Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'turn_number' => 5,
        'arrived_at' => now()->subDay(),
    ]);

    $this->actingAs($this->user)
        ->post('/tablero/turnos', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
        ])
        ->assertRedirect();

    $turn = Turn::where('patient_id', $this->patient->id)->first();
    expect($turn->turn_number)->toBe(1);
});

test('store turn validates required fields', function () {
    $this->actingAs($this->user)
        ->post('/tablero/turnos', [])
        ->assertSessionHasErrors(['patient_id', 'doctor_id']);
});

test('unauthorized user gets 403 on POST /tablero/turnos', function () {
    $noPerms = User::factory()->create();
    $this->actingAs($noPerms)
        ->post('/tablero/turnos', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
        ])
        ->assertForbidden();
});

test('store turn redirects with flash success', function () {
    $this->actingAs($this->user)
        ->post('/tablero/turnos', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Turno asignado correctamente.');
});

// ─── UpdateStatus ─────────────────────────────────────────────────────────────

test('authorized user can update turn status to en_consulta', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'espera',
    ]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'en_consulta'])
        ->assertRedirect(route('tablero'));

    expect($turn->fresh()->status)->toBe('en_consulta');

    expect(session('inertia.flash_data.toast.type'))->toBe('success');
    expect(session('inertia.flash_data.toast.message'))->toBe('Estado del turno actualizado.');
});

test('a turn in consultation can be sent back to the queue', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
    ]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'espera'])
        ->assertRedirect(route('tablero'))
        ->assertSessionHasNoErrors();

    expect($turn->fresh()->status)->toBe('espera');
});

test('the Tablero cannot mark a turn as atendido; only the discharge does', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
    ]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'atendido'])
        ->assertSessionHasErrors(['status']);

    expect($turn->fresh()->status)->toBe('en_consulta');
});

test('a turn in consultation cannot be marked no_asistio', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
    ]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'no_asistio'])
        ->assertSessionHasErrors(['status']);

    expect($turn->fresh()->status)->toBe('en_consulta');
});

test('a closed turn cannot be reopened from the Tablero', function (string $closed) {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => $closed,
    ]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'espera'])
        ->assertSessionHasErrors(['status']);

    expect($turn->fresh()->status)->toBe($closed);
})->with(['atendido', 'no_asistio']);

test('update turn status validates allowed values', function () {
    $turn = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'invalid'])
        ->assertSessionHasErrors(['status']);
});

test('unauthorized user gets 403 on PATCH /tablero/turnos/{turn}/status', function () {
    $noPerms = User::factory()->create();
    $turn = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id]);

    $this->actingAs($noPerms)
        ->patch("/tablero/turnos/{$turn->id}/status", ['status' => 'en_consulta'])
        ->assertForbidden();
});

// ─── Reorder ─────────────────────────────────────────────────────────────────

test('authorized user can reorder turn down', function () {
    $patient2 = Patient::factory()->create();

    $t1 = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id, 'turn_number' => 1, 'turn_order' => 10, 'arrived_at' => now()]);
    $t2 = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $patient2->id,      'turn_number' => 2, 'turn_order' => 20, 'arrived_at' => now()]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$t1->id}/reorder", ['direction' => 'down'])
        ->assertRedirect();

    expect($t1->fresh()->turn_order)->toBe(20);
    expect($t2->fresh()->turn_order)->toBe(10);
});

test('authorized user can reorder turn up', function () {
    $patient2 = Patient::factory()->create();

    $t1 = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id, 'turn_number' => 1, 'turn_order' => 10, 'arrived_at' => now()]);
    $t2 = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $patient2->id,      'turn_number' => 2, 'turn_order' => 20, 'arrived_at' => now()]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$t2->id}/reorder", ['direction' => 'up'])
        ->assertRedirect();

    expect($t2->fresh()->turn_order)->toBe(10);
    expect($t1->fresh()->turn_order)->toBe(20);
});

test('reorder validates direction field', function () {
    $turn = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id]);

    $this->actingAs($this->user)
        ->patch("/tablero/turnos/{$turn->id}/reorder", ['direction' => 'sideways'])
        ->assertSessionHasErrors(['direction']);
});

test('unauthorized user gets 403 on PATCH /tablero/turnos/{turn}/reorder', function () {
    $noPerms = User::factory()->create();
    $turn = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id]);

    $this->actingAs($noPerms)
        ->patch("/tablero/turnos/{$turn->id}/reorder", ['direction' => 'down'])
        ->assertForbidden();
});
