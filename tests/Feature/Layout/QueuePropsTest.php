<?php

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Testing\TestResponse;
use Inertia\Inertia;

// Helper: perform a partial reload requesting only the 'queue' prop.
// Sends the correct Inertia version so the middleware does NOT return 409.
function partialQueueRequest(object $test, User $user, string $component = 'inicio/index'): TestResponse
{
    // Compute the same version the Inertia middleware computes
    $manifestPath = public_path('build/manifest.json');
    $version = file_exists($manifestPath) ? hash_file('xxh128', $manifestPath) : '';

    return $test->actingAs($user)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $version,
            'X-Inertia-Partial-Component' => $component,
            'X-Inertia-Partial-Data' => 'queue',
        ])
        ->get('/inicio');
}

// ─── Queue optional prop (resolved on partial reloads) ────────────────────────

test('usuario con doctor vinculado recibe waiting_count correcto en partial reload', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);
    Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 2,
        'turn_order' => 20,
    ]);

    partialQueueRequest($this, $user)
        ->assertOk()
        ->assertJsonPath('props.queue.waiting_count', 2);
});

test('usuario sin doctor vinculado recibe queue null en partial reload', function () {
    $user = User::factory()->create();
    $user->assignRole('secretaria');

    partialQueueRequest($this, $user)
        ->assertOk()
        ->assertJsonPath('props.queue', null);
});

test('queue solo cuenta turnos en espera del doctor del dia de hoy', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);
    $otherDoctor = Doctor::factory()->create(['specialty_id' => $specialty->id]);

    // 2 waiting turns for our doctor today
    Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);
    Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 2,
        'turn_order' => 20,
    ]);

    // 1 waiting turn for OTHER doctor (must NOT be counted)
    Turn::factory()->create([
        'doctor_id' => $otherDoctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);

    partialQueueRequest($this, $user)
        ->assertOk()
        ->assertJsonPath('props.queue.waiting_count', 2);
});

test('queue incluye current_turn cuando hay un turno en_consulta del doctor', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
        'turn_number' => 3,
        'turn_order' => 10,
    ]);

    partialQueueRequest($this, $user)
        ->assertOk()
        ->assertJsonPath('props.queue.current_turn.turn_number', 3);
});

// ─── "Llamar siguiente" action ───────────────────────────────────────────────

test('llamar siguiente avanza el turno con menor turn_order en espera', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    $turn1 = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);
    $turn2 = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 2,
        'turn_order' => 20,
    ]);

    $this->actingAs($user)
        ->post(route('turnos.call-next'))
        ->assertRedirect();

    expect($turn1->fresh()->status)->toBe('en_consulta');
    expect($turn2->fresh()->status)->toBe('espera');
});

test('llamar siguiente NO afecta turnos de otros doctores', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $myDoctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);
    $otherDoctor = Doctor::factory()->create(['specialty_id' => $specialty->id]);

    $myTurn = Turn::factory()->create([
        'doctor_id' => $myDoctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);
    $otherTurn = Turn::factory()->create([
        'doctor_id' => $otherDoctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 1,
        'turn_order' => 5,  // lower order but wrong doctor
    ]);

    $this->actingAs($user)
        ->post(route('turnos.call-next'));

    expect($myTurn->fresh()->status)->toBe('en_consulta');
    expect($otherTurn->fresh()->status)->toBe('espera');
});

test('llamar siguiente retorna redirect con error de sesion cuando no hay pacientes en espera', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('turnos.call-next'))
        ->assertRedirect()
        ->assertSessionHasErrors(['queue']);
});

test('usuario sin doctor vinculado no puede llamar siguiente (403)', function () {
    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $this->actingAs($user)
        ->post(route('turnos.call-next'))
        ->assertStatus(403);
});

// ─── Adjustment 4: impedir llamar siguiente cuando hay un turno en_consulta ──

test('callNext retorna error y no cambia estado si ya hay un turno en_consulta', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    $consultaTurn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);

    $waitingTurn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now(),
        'turn_number' => 2,
        'turn_order' => 20,
    ]);

    $this->actingAs($user)
        ->post(route('turnos.call-next'))
        ->assertRedirect()
        ->assertSessionHasErrors(['queue']);

    // No turn should change status
    expect($consultaTurn->fresh()->status)->toBe('en_consulta');
    expect($waitingTurn->fresh()->status)->toBe('espera');
});

// ─── Adjustment 3: queue usa arrived_at, no created_at ───────────────────────

test('queue no cuenta turnos con arrived_at de ayer', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    // Turn arrived yesterday → must NOT appear in today's queue
    Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now()->subDay(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);

    partialQueueRequest($this, $user)
        ->assertOk()
        ->assertJsonPath('props.queue.waiting_count', 0);
});

test('callNext no llama un turno con arrived_at de ayer', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    $yesterdayTurn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => Patient::factory()->create()->id,
        'status' => 'espera',
        'arrived_at' => now()->subDay(),
        'turn_number' => 1,
        'turn_order' => 10,
    ]);

    $this->actingAs($user)
        ->post(route('turnos.call-next'))
        ->assertRedirect()
        ->assertSessionHasErrors(['queue']);

    expect($yesterdayTurn->fresh()->status)->toBe('espera');
});

// ─── queue comes in the same response ────────────────────────────────────────
// Deferring it made every navigation of a doctor fire a second request that
// ran the whole page again, just for two counts.

test('la prop queue llega en la misma respuesta, sin una segunda petición', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)->get('/inicio');

    $page = json_decode(json_encode($response->viewData('page')), true);

    expect(collect($page['deferredProps'] ?? [])->flatten()->all())->not->toContain('queue')
        ->and($page['props']['queue'])->toBe(['current_turn' => null, 'waiting_count' => 0]);
});

test('usuario sin doctor vinculado recibe queue null en la respuesta inicial', function () {
    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $response = $this->actingAs($user)->get('/inicio');

    $page = json_decode(json_encode($response->viewData('page')), true);

    // No doctor → queue is null (eager, not deferred)
    expect($page['props']['queue'] ?? null)->toBeNull();
});
