<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Admission;
use App\Models\Doctor;
use App\Models\OperatingRoom;
use App\Models\Patient;
use App\Models\Room;
use App\Models\Specialty;
use App\Models\Surgery;
use App\Models\SurgeryProcedure;
use App\Models\User;
use Database\Seeders\RoomSeeder;
use Database\Seeders\SurgerySeeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Carbon::setTestNow('2026-11-10 08:00:00'); // martes
    $this->seed([SurgerySeeder::class, RoomSeeder::class]);
    $this->cirujano = User::factory()->create();
    $this->cirujano->assignRole('medico');
    $specialty = Specialty::factory()->create();
    $this->surgeon = Doctor::factory()->create(['name' => 'Dra. Mildred Guzmán', 'user_id' => $this->cirujano->id, 'specialty_id' => $specialty->id, 'is_active' => true]);
    $this->anesthetist = Doctor::factory()->create(['name' => 'Dr. Ramón Peralta', 'specialty_id' => $specialty->id, 'is_active' => true]);
    $this->enfermera = User::factory()->create();
    $this->enfermera->assignRole('enfermeria');
    $this->patient = Patient::factory()->create();
    $this->apendice = SurgeryProcedure::where('code', 'Q-01')->first();
    $this->q1 = OperatingRoom::where('name', 'Quirófano 1')->first();
});

afterEach(fn () => Carbon::setTestNow());

function surgeryPayload(array $overrides = []): array
{
    return [
        'patient_id' => test()->patient->id,
        'surgery_procedure_id' => test()->apendice->id,
        'surgeon_id' => test()->surgeon->id,
        'anesthetist_id' => test()->anesthetist->id,
        'operating_room_id' => test()->q1->id,
        'date' => '2026-11-12',
        'time' => '09:00',
        'duration_minutes' => 90,
        ...$overrides,
    ];
}

function scheduled(array $overrides = []): Surgery
{
    test()->actingAs(test()->cirujano)->post('/cirugia', surgeryPayload($overrides))->assertSessionHasNoErrors();

    return Surgery::latest('id')->firstOrFail();
}

test('a doctor schedules an ambulatory surgery; the week agenda shows it', function () {
    $this->actingAs($this->cirujano)
        ->post('/cirugia', surgeryPayload())
        ->assertSessionHasNoErrors()
        ->assertRedirect('/cirugia?semana=2026-11-12&cirugia='.Surgery::value('id'));

    $surgery = Surgery::firstOrFail();
    expect($surgery->number)->toBe('Q-000001')
        ->and($surgery->procedure_name)->toBe('Apendicectomía')
        ->and($surgery->price)->toBe(3500000)
        ->and($surgery->starts_at->format('Y-m-d H:i'))->toBe('2026-11-12 09:00')
        ->and($surgery->ends_at->format('H:i'))->toBe('10:30')
        ->and($surgery->status)->toBe('programada')
        ->and($surgery->admission_id)->toBeNull()
        ->and(AccountCharge::count())->toBe(0);

    $this->actingAs($this->enfermera)
        ->get('/cirugia')
        ->assertInertia(fn ($page) => $page
            ->component('cirugia/index')
            ->where('week_start', '2026-11-09')
            ->has('surgeries', 1)
            ->where('surgeries.0.procedure', 'Apendicectomía')
            ->where('surgeries.0.date_label', 'Jue 12/11/2026')
            ->where('surgeries.0.start', '09:00')
            ->where('surgeries.0.end', '10:30')
            ->where('surgeries.0.room', 'Ambulatoria')
            ->where('surgeries.0.anesthetist', 'Dr. Ramón Peralta')
            ->where('can_schedule', false)
            ->where('can_advance', true)
            ->has('options.procedures', 6)
        );

    $this->actingAs($this->enfermera)->get('/cirugia?semana=2026-11-16')->assertInertia(fn ($page) => $page->has('surgeries', 0));
});

test('two surgeries never overlap in the same operating room', function () {
    scheduled();

    $this->actingAs($this->cirujano)->post('/cirugia', surgeryPayload(['time' => '10:00']))->assertSessionHasErrors('starts_at');
    $this->actingAs($this->cirujano)->post('/cirugia', surgeryPayload(['time' => '10:30']))->assertSessionHasNoErrors();

    $q2 = OperatingRoom::create(['name' => 'Quirófano 2', 'position' => 2]);
    $this->actingAs($this->cirujano)->post('/cirugia', surgeryPayload(['time' => '09:30', 'operating_room_id' => $q2->id]))->assertSessionHasNoErrors();

    expect(Surgery::count())->toBe(3);
});

test('nursing cannot schedule; the anesthetist must differ from the surgeon', function () {
    $this->actingAs($this->enfermera)->post('/cirugia', surgeryPayload())->assertForbidden();
    $this->actingAs($this->cirujano)->post('/cirugia', surgeryPayload(['anesthetist_id' => $this->surgeon->id]))->assertSessionHasErrors('anesthetist_id');
});

test('a scheduled surgery is rescheduled or cancelled with a reason, never charged', function () {
    $surgery = scheduled();

    $this->actingAs($this->cirujano)
        ->put("/cirugia/{$surgery->id}", ['operating_room_id' => $this->q1->id, 'date' => '2026-11-13', 'time' => '14:00', 'duration_minutes' => 60])
        ->assertSessionHasNoErrors();
    expect($surgery->fresh()->starts_at->format('Y-m-d H:i'))->toBe('2026-11-13 14:00')
        ->and($surgery->fresh()->ends_at->format('H:i'))->toBe('15:00');

    $this->actingAs($this->cirujano)->post("/cirugia/{$surgery->id}/cancelar", ['reason' => ''])->assertSessionHasErrors('reason');
    $this->actingAs($this->cirujano)->post("/cirugia/{$surgery->id}/cancelar", ['reason' => 'Paciente con fiebre'])->assertSessionHasNoErrors();

    expect($surgery->fresh()->status)->toBe('cancelada')
        ->and(AccountCharge::count())->toBe(0);
    // A cancelled slot is free again
    $this->actingAs($this->cirujano)->post('/cirugia', surgeryPayload(['date' => '2026-11-13', 'time' => '14:00']))->assertSessionHasNoErrors();
});

test('nursing moves it to the operating room and marks it performed: charged to the account of the day', function () {
    $surgery = scheduled();
    Carbon::setTestNow('2026-11-12 09:05:00');

    $this->actingAs($this->enfermera)->post("/cirugia/{$surgery->id}/avanzar")->assertSessionHasNoErrors();
    expect($surgery->fresh()->status)->toBe('quirofano');
    // No longer reschedulable
    $this->actingAs($this->cirujano)->post("/cirugia/{$surgery->id}/cancelar", ['reason' => 'x'])->assertSessionHasErrors('surgery');

    $this->actingAs($this->enfermera)->post("/cirugia/{$surgery->id}/avanzar")->assertSessionHasNoErrors();
    $surgery->refresh();
    $charge = AccountCharge::firstOrFail();
    expect($surgery->status)->toBe('realizada')
        ->and($surgery->account_charge_id)->toBe($charge->id)
        ->and($charge->type)->toBe('cirugia')
        ->and($charge->total)->toBe(3500000)
        ->and($charge->account->status)->toBe('pendiente_facturar');

    $this->actingAs($this->enfermera)->post("/cirugia/{$surgery->id}/avanzar")->assertSessionHasErrors('surgery');
    expect(AccountCharge::count())->toBe(1);
});

test('«Ingreso para cirugía» admits and schedules; the charge goes to the stay', function () {
    $bed = Room::where('name', 'Hab. 5')->first()->beds()->first();

    $this->actingAs($this->cirujano)
        ->post('/internamiento/ingresos', [
            'patient_id' => $this->patient->id,
            'bed_id' => $bed->id,
            'doctor_id' => $this->surgeon->id,
            'diagnosis' => 'K35.8 Apendicitis aguda',
            'surgery' => surgeryPayload(['date' => '2026-11-10', 'time' => '11:00']),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/cirugia?semana=2026-11-10&cirugia='.Surgery::value('id'));

    $admission = Admission::firstOrFail();
    $surgery = Surgery::firstOrFail();
    expect($surgery->admission_id)->toBe($admission->id);

    $this->actingAs($this->enfermera)->get('/internamiento')
        ->assertInertia(fn ($page) => $page->where('rooms.4.beds.0.admission.for_surgery', true));
    $this->actingAs($this->enfermera)->get('/cirugia')
        ->assertInertia(fn ($page) => $page->where('surgeries.0.room', 'Hab. 5 · Cama única'));

    $this->actingAs($this->enfermera)->post("/cirugia/{$surgery->id}/avanzar");
    $this->actingAs($this->enfermera)->post("/cirugia/{$surgery->id}/avanzar");

    expect(AccountCharge::where('type', 'cirugia')->value('account_id'))->toBe($admission->account_id)
        ->and($admission->account->fresh()->status)->toBe('abierta')
        ->and(Account::count())->toBe(1);
});

test('the surgery tables migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_09_100000_create_surgery_tables.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('surgeries'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(OperatingRoom::pluck('name')->all())->toBe(['Quirófano 1']);
});
