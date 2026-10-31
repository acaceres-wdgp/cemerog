<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Console\Scheduling\Schedule;

beforeEach(function () {
    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->patient = Patient::factory()->create();
    $this->user = User::factory()->create();
});

/** A turn on the given day with its daily account and consultation charge. */
function staleTurnWithCharge(Patient $patient, Doctor $doctor, User $by, string $status, CarbonInterface $day): Turn
{
    $turn = Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => $status,
        'arrived_at' => $day,
    ]);
    $account = Account::where('patient_id', $patient->id)
        ->whereDate('service_date', $day)
        ->where('status', 'abierta')
        ->first()
        ?? Account::create([
            'patient_id' => $patient->id,
            'service_date' => $day->toDateString(),
            'status' => 'abierta',
            'opened_at' => $day,
        ]);
    AccountCharge::create([
        'account_id' => $account->id,
        'turn_id' => $turn->id,
        'doctor_id' => $doctor->id,
        'created_by' => $by->id,
        'type' => 'consulta',
        'description' => 'Consulta',
        'quantity' => 1,
        'unit_price' => 150000,
        'total' => 150000,
    ]);

    return $turn;
}

test('a waiting turn from a previous day becomes no_asistio, loses its charge and annuls the account', function () {
    $yesterday = now()->subDay()->setTime(9, 0);
    $turn = staleTurnWithCharge($this->patient, $this->doctor, $this->user, 'espera', $yesterday);

    $this->artisan('cemerog:close-stale-turns')->assertSuccessful();

    expect($turn->fresh()->status)->toBe('no_asistio')
        ->and(AccountCharge::where('turn_id', $turn->id)->exists())->toBeFalse();

    $account = Account::where('patient_id', $this->patient->id)->sole();
    expect($account->status)->toBe('anulada')
        ->and($account->closed_at)->not->toBeNull();
});

test('turns from today are left alone', function () {
    $turn = staleTurnWithCharge($this->patient, $this->doctor, $this->user, 'espera', now()->setTime(8, 0));

    $this->artisan('cemerog:close-stale-turns')->assertSuccessful();

    expect($turn->fresh()->status)->toBe('espera')
        ->and(Account::where('patient_id', $this->patient->id)->sole()->status)->toBe('abierta');
});

test('a stale turn in consultation is not marked as no-show', function () {
    $turn = staleTurnWithCharge($this->patient, $this->doctor, $this->user, 'en_consulta', now()->subDay()->setTime(9, 0));

    $this->artisan('cemerog:close-stale-turns')->assertSuccessful();

    expect($turn->fresh()->status)->toBe('en_consulta')
        ->and(AccountCharge::where('turn_id', $turn->id)->exists())->toBeTrue();
});

test('the day account stays pending billing when another turn that day was attended', function () {
    $yesterday = now()->subDay()->setTime(9, 0);
    $attended = staleTurnWithCharge($this->patient, $this->doctor, $this->user, 'atendido', $yesterday);
    $otherDoctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $waiting = staleTurnWithCharge($this->patient, $otherDoctor, $this->user, 'espera', $yesterday->copy()->addHour());

    $this->artisan('cemerog:close-stale-turns')->assertSuccessful();

    expect($waiting->fresh()->status)->toBe('no_asistio');

    $account = Account::where('patient_id', $this->patient->id)->sole();
    expect($account->status)->toBe('pendiente_facturar')
        ->and($account->charges()->pluck('turn_id')->all())->toBe([$attended->id]);
});

test('running it twice changes nothing the second time', function () {
    staleTurnWithCharge($this->patient, $this->doctor, $this->user, 'espera', now()->subDays(2)->setTime(9, 0));

    $this->artisan('cemerog:close-stale-turns')->assertSuccessful();
    $this->artisan('cemerog:close-stale-turns')
        ->expectsOutputToContain(': 0.')
        ->assertSuccessful();
});

test('the command is scheduled daily', function () {
    $events = collect(app(Schedule::class)->events())
        ->filter(fn ($event) => str_contains((string) $event->command, 'cemerog:close-stale-turns'));

    expect($events)->toHaveCount(1)
        ->and($events->first()->expression)->toBe('5 0 * * *');
});
