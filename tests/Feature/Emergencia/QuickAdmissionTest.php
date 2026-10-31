<?php

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Actions\UpdatePatient;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->enfermera = User::factory()->create(['name' => 'Yaniris Cabrera']);
    $this->enfermera->assignRole('enfermeria');
    $this->secretaria = User::factory()->create();
    $this->secretaria->assignRole('secretaria');

    $this->doctor = Doctor::factory()->create([
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->cub1 = EmergencyCubicle::where('name', 'Cub. 1')->first();
    $this->cub2 = EmergencyCubicle::where('name', 'Cub. 2')->first();
});

function newPatientAdmission(array $overrides = []): array
{
    return [
        'identified' => true,
        'first_names' => 'José Ramón',
        'last_names' => 'Tavárez Cruz',
        'document_type' => 'cedula',
        'document_number' => '031-0567812-4',
        'sex' => 'M',
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => Doctor::value('id'),
        'reason' => 'Herida cortante en mano derecha con sangrado activo.',
        ...$overrides,
    ];
}

test('the quick admission page offers free cubicles, doctors and the emergency fee', function () {
    $this->actingAs($this->enfermera)
        ->get('/emergencia/ingreso')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('emergencia/ingreso')
            ->has('cubicles', 7)
            ->where('cubicles.0.name', 'Cub. 1')
            ->has('doctors', 1)
            ->where('emergency_fee', 150000)
        );
});

test('a new patient is registered with the minimum, marked incomplete and charged the emergency fee', function () {
    $this->actingAs($this->enfermera)
        ->post('/emergencia/ingreso', newPatientAdmission())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $patient = Patient::first();
    expect($patient->full_name)->toBe('José Ramón Tavárez Cruz')
        ->and($patient->birth_date)->toBeNull()
        ->and($patient->age)->toBeNull()
        ->and($patient->profile_incomplete)->toBeTrue();

    $emergency = Emergency::first();
    expect($emergency->number)->toBe('E-000001')
        ->and($emergency->status)->toBe('activa')
        ->and($emergency->cubicle_id)->toBe($this->cub1->id)
        ->and($emergency->occupied_cubicle_id)->toBe($this->cub1->id)
        ->and($emergency->doctor_id)->toBe($this->doctor->id)
        ->and($emergency->created_by)->toBe($this->enfermera->id);

    $charge = AccountCharge::first();
    expect($charge->account_id)->toBe($emergency->account_id)
        ->and($charge->type)->toBe('emergencia')
        ->and($charge->description)->toBe('Emergencia')
        ->and($charge->total)->toBe(150000)
        ->and($charge->source_type)->toBe(Emergency::class)
        ->and(Account::find($emergency->account_id)->status)->toBe('abierta');
});

test('an unidentified patient is registered as N.N. without a document', function () {
    $this->actingAs($this->enfermera)
        ->post('/emergencia/ingreso', newPatientAdmission([
            'identified' => false,
            'first_names' => null,
            'last_names' => null,
            'document_type' => 'no_tiene',
            'document_number' => null,
            'sex' => 'F',
        ]))
        ->assertSessionHasNoErrors();

    $patient = Patient::first();
    expect($patient->first_names)->toBe('N.N.')
        ->and($patient->last_names)->toBe('Sin identificar')
        ->and($patient->document_type)->toBe('no_tiene')
        ->and($patient->document_number)->toStartWith('GEN-')
        ->and($patient->profile_incomplete)->toBeTrue();
});

test('an existing patient found by identification is admitted without changing the profile', function () {
    $patient = Patient::factory()->create();

    $this->actingAs($this->enfermera)
        ->post('/emergencia/ingreso', [
            'patient_id' => $patient->id,
            'cubicle_id' => $this->cub2->id,
            'doctor_id' => $this->doctor->id,
            'reason' => 'Dolor torácico.',
        ])
        ->assertSessionHasNoErrors();

    expect(Patient::count())->toBe(1)
        ->and($patient->fresh()->profile_incomplete)->toBeFalse()
        ->and(Emergency::first()->patient_id)->toBe($patient->id);
});

test('an occupied or inactive cubicle cannot be assigned', function () {
    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', newPatientAdmission());

    $this->actingAs($this->enfermera)
        ->post('/emergencia/ingreso', newPatientAdmission(['document_number' => '001-0000001-1']))
        ->assertSessionHasErrors(['cubicle_id']);

    $this->cub2->update(['is_active' => false]);
    $this->actingAs($this->enfermera)
        ->post('/emergencia/ingreso', newPatientAdmission(['document_number' => '001-0000001-1', 'cubicle_id' => $this->cub2->id]))
        ->assertSessionHasErrors(['cubicle_id']);

    expect(Emergency::count())->toBe(1);

    $this->actingAs($this->enfermera)
        ->get('/emergencia/ingreso')
        ->assertInertia(fn ($page) => $page->has('cubicles', 5));
});

test('a patient already in emergency cannot be admitted twice', function () {
    $patient = Patient::factory()->create();
    $data = ['patient_id' => $patient->id, 'doctor_id' => $this->doctor->id, 'reason' => 'Fiebre.'];

    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', [...$data, 'cubicle_id' => $this->cub1->id]);
    $this->actingAs($this->enfermera)
        ->post('/emergencia/ingreso', [...$data, 'cubicle_id' => $this->cub2->id])
        ->assertSessionHasErrors(['patient_id']);
});

test('the admission needs the reason, sex, cubicle, doctor and an unused document', function () {
    Patient::factory()->create(['document_type' => 'cedula', 'document_number' => '031-0567812-4']);

    $this->actingAs($this->enfermera)
        ->post('/emergencia/ingreso', newPatientAdmission(['reason' => '', 'sex' => null, 'cubicle_id' => null, 'doctor_id' => null]))
        ->assertSessionHasErrors(['reason', 'sex', 'cubicle_id', 'doctor_id', 'document_number']);
});

test('the account stays open while the patient is in emergency', function () {
    $patient = Patient::factory()->create();
    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', [
        'patient_id' => $patient->id, 'cubicle_id' => $this->cub1->id, 'doctor_id' => $this->doctor->id, 'reason' => 'Fiebre.',
    ]);

    app(CloseDailyAccountIfDone::class)->handle($patient);

    expect(Account::first()->status)->toBe('abierta');
});

test('the patient search for emergency finds by identification', function () {
    $patient = Patient::factory()->create(['document_type' => 'cedula', 'document_number' => '031-0567812-4']);

    $this->actingAs($this->enfermera)
        ->getJson('/emergencia/pacientes/buscar?q=031-0567812-4')
        ->assertOk()
        ->assertJsonPath('0.id', $patient->id)
        ->assertJsonPath('0.document_number', '031-0567812-4');
});

test('only clinical staff can admit to emergency', function () {
    $this->actingAs($this->secretaria)->get('/emergencia/ingreso')->assertForbidden();
    $this->actingAs($this->secretaria)->post('/emergencia/ingreso', newPatientAdmission())->assertForbidden();
});

test('completing the profile in Recepción clears the incomplete mark', function () {
    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', newPatientAdmission());
    $patient = Patient::first();

    app(UpdatePatient::class)->handle($patient, ['birth_date' => '1990-01-01', 'phone' => '809-555-0101']);

    expect($patient->fresh()->profile_incomplete)->toBeFalse()
        ->and($patient->fresh()->age)->toBeInt();
});

test('the emergencies migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_03_200000_create_emergencies_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('emergencies'))->toBeFalse()
        ->and(Schema::hasColumn('patients', 'profile_incomplete'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('emergencies'))->toBeTrue();
});
