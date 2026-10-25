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

// ─── Adjustment 1: queue debe ser deferred (no optional) ─────────────────────

test('la prop queue es deferred en la respuesta Inertia inicial', function () {
    $user = User::factory()->create();
    $user->assignRole('medico');

    $specialty = Specialty::factory()->create();
    Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    // Initial Inertia page load: queue should appear in deferredProps, not in props
    $response = $this->actingAs($user)->get('/inicio');

    // The page data is passed to the view; decode it
    $page = json_decode(json_encode($response->viewData('page')), true);

    expect($page['deferredProps'] ?? [])->not->toBeEmpty();
    $allDeferred = collect($page['deferredProps'])->flatten()->values()->all();
    expect($allDeferred)->toContain('queue');
    // queue must NOT be eagerly resolved in the initial props
    expect(array_key_exists('queue', $page['props']))->toBeFalse();
});

test('usuario sin doctor vinculado recibe queue null en la respuesta inicial', function () {
    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $response = $this->actingAs($user)->get('/inicio');

    $page = json_decode(json_encode($response->viewData('page')), true);

    // No doctor → queue is null (eager, not deferred)
    expect($page['props']['queue'] ?? null)->toBeNull();
});
