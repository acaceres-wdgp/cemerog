<?php

use App\Actions\Accounts\AddConsultationCharge;
use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Actions\Emergencia\AdmitToEmergency;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\Patient;
use App\Models\Setting;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'user_id' => $this->medico->id,
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();
    $this->cub2 = EmergencyCubicle::where('name', 'Cub. 2')->first();
});

/** A turn in consulta registered as Registro does, with its account and consultation charge */
function turnInConsulta(Doctor $doctor, Patient $patient): Turn
{
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);
    $account = app(GetOrOpenDailyAccount::class)->handle($patient, now());
    app(AddConsultationCharge::class)->handle($account, $turn, $doctor->user);

    return $turn;
}

function occupyCubicle(EmergencyCubicle $cubicle, Doctor $doctor, User $user): void
{
    app(AdmitToEmergency::class)
        ->handle(Patient::factory()->create(), null, $cubicle->id, $doctor->id, 'Otro paciente', $user);
}

test('consulta offers the free emergency cubicles', function () {
    occupyCubicle($this->cub2, $this->doctor, $this->medico);

    $this->actingAs($this->medico)
        ->get('/consulta')
        ->assertInertia(fn ($page) => $page
            ->where('emergency_cubicles', fn ($cubicles) => collect($cubicles)->pluck('id')->doesntContain($this->cub2->id)
                && collect($cubicles)->count() === EmergencyCubicle::active()->count() - 1)
        );
});

test('the doctor sends the patient from consulta to emergency keeping the account', function () {
    $turn = turnInConsulta($this->doctor, $this->patient);
    $account = Account::firstOrFail();

    $response = $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$turn->id}/emergencia", [
            'cubicle_id' => $this->cub2->id,
            'reason' => 'Dolor torácico opresivo durante la consulta.',
        ])
        ->assertSessionHasNoErrors();

    $emergency = Emergency::firstOrFail();
    $response->assertRedirect("/emergencia/{$emergency->id}");

    expect($emergency->turn_id)->toBe($turn->id)
        ->and($emergency->patient_id)->toBe($this->patient->id)
        ->and($emergency->doctor_id)->toBe($this->doctor->id)
        ->and($emergency->occupied_cubicle_id)->toBe($this->cub2->id)
        ->and($emergency->reason)->toBe('Dolor torácico opresivo durante la consulta.')
        ->and($emergency->account_id)->toBe($account->id)
        ->and($turn->fresh()->status)->toBe('atendido')
        ->and($account->fresh()->status)->toBe('abierta')
        ->and(AccountCharge::where('account_id', $account->id)->pluck('type')->sort()->values()->all())
        ->toBe(['consulta', 'emergencia'])
        ->and(AccountCharge::where('type', 'emergencia')->value('total'))->toBe(Setting::emergencyFee());
});

test('only the doctor of an open turn can send it to emergency', function () {
    $turn = turnInConsulta($this->doctor, $this->patient);
    $other = User::factory()->create();
    $other->assignRole('medico');
    Doctor::factory()->create(['user_id' => $other->id, 'specialty_id' => $this->doctor->specialty_id, 'is_active' => true]);

    $this->actingAs($other)
        ->post("/consulta/turnos/{$turn->id}/emergencia", ['cubicle_id' => $this->cub2->id, 'reason' => 'x'])
        ->assertForbidden();

    $turn->update(['status' => 'atendido']);
    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$turn->id}/emergencia", ['cubicle_id' => $this->cub2->id, 'reason' => 'x'])
        ->assertForbidden();

    expect(Emergency::count())->toBe(0);
});

test('the cubicle must be free and the reason is required', function () {
    $turn = turnInConsulta($this->doctor, $this->patient);
    occupyCubicle($this->cub2, $this->doctor, $this->medico);

    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$turn->id}/emergencia", ['cubicle_id' => $this->cub2->id, 'reason' => ''])
        ->assertSessionHasErrors(['reason']);

    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$turn->id}/emergencia", ['cubicle_id' => $this->cub2->id, 'reason' => 'Disnea.'])
        ->assertSessionHasErrors(['cubicle_id']);

    expect($turn->fresh()->status)->toBe('en_consulta')
        ->and(Emergency::count())->toBe(1);
});

test('the turn_id migration on emergencies can be rolled back', function () {
    $path = 'database/migrations/2026_11_06_100000_add_turn_id_to_emergencies_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasColumn('emergencies', 'turn_id'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasColumn('emergencies', 'turn_id'))->toBeTrue();
});
