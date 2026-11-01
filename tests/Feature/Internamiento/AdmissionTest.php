<?php

use App\Actions\Accounts\AddConsultationCharge;
use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Actions\Emergencia\AdmitToEmergency;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Admission;
use App\Models\Discharge;
use App\Models\Doctor;
use App\Models\EmergencyCubicle;
use App\Models\InventoryItem;
use App\Models\LabOrder;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\Room;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Database\Seeders\LabCatalogSeeder;
use Database\Seeders\RoomSeeder;
use Illuminate\Support\Carbon;

beforeEach(function () {
    Carbon::setTestNow('2026-11-10 10:00:00');
    $this->seed(RoomSeeder::class);
    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'name' => 'Dr. Franklin Rodríguez',
        'user_id' => $this->medico->id,
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->enfermera = User::factory()->create(['name' => 'Lic. Yaniris Cabrera']);
    $this->enfermera->assignRole('enfermeria');
    $this->patient = Patient::factory()->create();
    $this->bed2A = Room::where('name', 'Hab. 2')->first()->beds()->where('name', 'Cama A')->first();
    $this->bed1 = Room::where('name', 'Hab. 1')->first()->beds()->first();
});

afterEach(fn () => Carbon::setTestNow());

function admitPayload(array $overrides = []): array
{
    return [
        'patient_id' => test()->patient->id,
        'bed_id' => test()->bed2A->id,
        'doctor_id' => test()->doctor->id,
        'diagnosis' => 'J18.9 Neumonía, no especificada',
        'treatment' => 'Ceftriaxona 1 g IV cada 12 horas.',
        ...$overrides,
    ];
}

function admitted(): Admission
{
    test()->actingAs(test()->medico)->post('/internamiento/ingresos', admitPayload())->assertSessionHasNoErrors();

    return Admission::latest('id')->firstOrFail();
}

test('the map lists rooms and beds with the patient in each, and the admission options', function () {
    $admission = admitted();

    $this->actingAs($this->enfermera)
        ->get('/internamiento')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('internamiento/index')
            ->has('rooms', 6)
            ->where('rooms.1.name', 'Hab. 2')
            ->where('rooms.1.daily_price', 250000)
            ->where('rooms.1.beds.0.status', 'ocupada')
            ->where('rooms.1.beds.0.admission.id', $admission->id)
            ->where('rooms.1.beds.0.admission.diagnosis', 'J18.9 Neumonía, no especificada')
            ->where('rooms.1.beds.0.admission.day', 1)
            ->has('admission_options.beds', 8)
            ->where('admission_options.doctors.0.name', 'Dr. Franklin Rodríguez')
        );
});

test('a direct admission occupies the bed, records the stay and opens the account of the stay', function () {
    $this->actingAs($this->medico)
        ->post('/internamiento/ingresos', admitPayload())
        ->assertSessionHasNoErrors()
        ->assertRedirect('/internamiento/'.Admission::value('id'));

    $admission = Admission::firstOrFail();
    expect($admission->number)->toBe('IN-000001')
        ->and($admission->origin)->toBe('directo')
        ->and($admission->diagnosis_code)->toBe('J18.9')
        ->and($admission->diagnosis_label)->toBe('Neumonía, no especificada')
        ->and($admission->bed_id)->toBe($this->bed2A->id)
        ->and($this->bed2A->fresh()->status)->toBe('ocupada')
        ->and($admission->stays)->toHaveCount(1)
        ->and($admission->stays[0]->daily_price)->toBe(250000)
        ->and($admission->stays[0]->bed_label)->toBe('Hab. 2 · Cama A')
        ->and($admission->account->status)->toBe('abierta');
});

test('the bed must be free and a patient is admitted only once', function () {
    admitted();

    $this->actingAs($this->medico)->post('/internamiento/ingresos', admitPayload(['bed_id' => $this->bed1->id]))
        ->assertSessionHasErrors('patient_id');
    $other = Patient::factory()->create();
    $this->actingAs($this->medico)->post('/internamiento/ingresos', admitPayload(['patient_id' => $other->id]))
        ->assertSessionHasErrors('bed_id');
    $this->actingAs($this->medico)->post('/internamiento/ingresos', admitPayload(['patient_id' => $other->id, 'bed_id' => $this->bed1->id, 'diagnosis' => '']))
        ->assertSessionHasErrors('diagnosis');
});

test('from emergency: the emergency closes as a transfer and the same account continues', function () {
    $emergency = app(AdmitToEmergency::class)->handle($this->patient, null, EmergencyCubicle::value('id'), $this->doctor->id, 'Disnea', $this->enfermera);

    $this->actingAs($this->enfermera)
        ->post('/internamiento/ingresos', admitPayload(['emergency_id' => $emergency->id]))
        ->assertSessionHasNoErrors();

    $admission = Admission::firstOrFail();
    $emergency->refresh();
    expect($admission->origin)->toBe('emergencia')
        ->and($admission->account_id)->toBe($emergency->account_id)
        ->and($emergency->status)->toBe('alta')
        ->and($emergency->occupied_cubicle_id)->toBeNull()
        ->and($emergency->account->status)->toBe('abierta')
        ->and(Discharge::where('emergency_id', $emergency->id)->value('destination'))->toBe('Internamiento · Hab. 2 · Cama A');
});

test('from consulta: the turn is attended and the account of the day continues with the consultation', function () {
    $turn = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id, 'status' => 'en_consulta', 'arrived_at' => now()]);
    $account = app(GetOrOpenDailyAccount::class)->handle($this->patient, now());
    app(AddConsultationCharge::class)->handle($account, $turn, $this->medico);

    $this->actingAs($this->medico)
        ->post('/internamiento/ingresos', admitPayload(['turn_id' => $turn->id]))
        ->assertSessionHasNoErrors();

    expect(Admission::first()->account_id)->toBe($account->id)
        ->and($turn->fresh()->status)->toBe('atendido')
        ->and($account->fresh()->status)->toBe('abierta');
});

test('while admitted, anything done on later days goes to the account of the stay', function () {
    $this->seed(LabCatalogSeeder::class);
    $admission = admitted();

    Carbon::setTestNow('2026-11-12 09:00:00');
    $this->actingAs($this->enfermera)
        ->post("/internamiento/{$admission->id}/estudios", ['lab_test_ids' => [LabTest::where('code', '130')->value('id')]])
        ->assertSessionHasNoErrors();
    $order = LabOrder::firstOrFail();
    expect($order->origin)->toBe('internamiento');

    $bio = User::factory()->create();
    $bio->assignRole('bioanalista');
    $this->actingAs($bio)->post("/laboratorio/ordenes/{$order->id}/muestra")->assertSessionHasNoErrors();

    expect(AccountCharge::where('type', 'laboratorio')->value('account_id'))->toBe($admission->account_id)
        ->and(Account::count())->toBe(1);
});

test('medications, vitals and nursing notes are recorded on the stay', function () {
    $admission = admitted();
    $item = InventoryItem::create(['code' => 'MED-009', 'name' => 'Ceftriaxona 1 g', 'presentation' => 'Vial', 'kind' => 'medicamento', 'price' => 45000, 'stock' => 10, 'min_stock' => 2]);

    $this->actingAs($this->enfermera)
        ->post("/internamiento/{$admission->id}/aplicaciones", ['kind' => 'medicamento', 'inventory_item_id' => $item->id, 'quantity' => 2, 'route' => 'IV'])
        ->assertSessionHasNoErrors();
    $this->actingAs($this->enfermera)
        ->post("/internamiento/{$admission->id}/signos-vitales", [
            'presion_arterial' => '120/80', 'frecuencia_cardiaca' => 88, 'frecuencia_respiratoria' => 18, 'temp' => '37.2', 'saturacion_o2' => 96,
        ])
        ->assertSessionHasNoErrors();
    $this->actingAs($this->enfermera)
        ->post("/internamiento/{$admission->id}/notas", ['body' => 'Paciente estable, tolera vía oral.'])
        ->assertSessionHasNoErrors();

    expect($item->fresh()->stock)->toBe(8)
        ->and(AccountCharge::where('account_id', $admission->account_id)->where('type', 'medicamento')->value('total'))->toBe(90000)
        ->and($admission->vitals()->count())->toBe(1)
        ->and($admission->notes()->first()->shift)->toBe('mañana');

    $this->actingAs($this->enfermera)
        ->get("/internamiento/{$admission->id}")
        ->assertInertia(fn ($page) => $page
            ->component('internamiento/show')
            ->where('admission.bed_label', 'Hab. 2 · Cama A')
            ->has('applications', 1)
            ->has('vitals', 1)
            ->where('notes.0.author', 'Lic. Yaniris Cabrera')
            ->where('charges.room.0.days', 1)
            ->where('charges.total', 90000 + 250000)
            ->where('can_discharge', true)
        );
});

test('a transfer leaves the previous bed in cleaning; it is marked ready later', function () {
    $admission = admitted();

    $this->actingAs($this->enfermera)
        ->post("/internamiento/{$admission->id}/traslado", ['bed_id' => $this->bed1->id, 'reason' => 'Aislamiento'])
        ->assertSessionHasNoErrors();

    expect($admission->fresh()->bed_id)->toBe($this->bed1->id)
        ->and($this->bed1->fresh()->status)->toBe('ocupada')
        ->and($this->bed2A->fresh()->status)->toBe('limpieza')
        ->and($admission->stays()->count())->toBe(2)
        ->and($admission->stays()->first()->ended_at)->not->toBeNull();

    $this->actingAs($this->enfermera)->post("/internamiento/{$admission->id}/traslado", ['bed_id' => $this->bed2A->id])
        ->assertSessionHasErrors('bed_id');

    $this->actingAs($this->enfermera)->post("/internamiento/camas/{$this->bed2A->id}/lista")->assertSessionHasNoErrors();
    expect($this->bed2A->fresh()->status)->toBe('libre');
});

test('discharge charges the room by days, the new price from the day after a change', function () {
    $admission = admitted(); // 10/11 in Semiprivada (RD$2,500)

    Carbon::setTestNow('2026-11-11 15:00:00'); // moved on day 2 to Privada (RD$3,500)
    $this->actingAs($this->enfermera)->post("/internamiento/{$admission->id}/traslado", ['bed_id' => $this->bed1->id]);

    Carbon::setTestNow('2026-11-12 11:00:00'); // discharged on day 3
    $this->actingAs($this->medico)
        ->post("/internamiento/{$admission->id}/alta", ['type' => 'recuperado', 'discharge_diagnosis' => 'Neumonía resuelta'])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/internamiento');

    $room = AccountCharge::where('type', 'habitacion')->orderBy('id')->get();
    $admission->refresh();
    expect($room)->toHaveCount(2)
        ->and($room[0]->quantity)->toBe(2)
        ->and($room[0]->unit_price)->toBe(250000)
        ->and($room[0]->description)->toBe('Habitación Semiprivada · Hab. 2 · Cama A (2 días)')
        ->and($room[1]->quantity)->toBe(1)
        ->and($room[1]->total)->toBe(350000)
        ->and($admission->status)->toBe('alta')
        ->and($admission->bed_id)->toBeNull()
        ->and($this->bed1->fresh()->status)->toBe('limpieza')
        ->and($admission->account->fresh()->status)->toBe('pendiente_facturar');
});

test('nurses and doctors discharge; the discharge happens once', function () {
    $admission = admitted();
    $secretaria = User::factory()->create();
    $secretaria->assignRole('secretaria');

    $this->actingAs($secretaria)->post("/internamiento/{$admission->id}/alta", ['type' => 'recuperado', 'discharge_diagnosis' => 'x'])->assertForbidden();
    $this->actingAs($this->enfermera)->post("/internamiento/{$admission->id}/alta", ['type' => 'recuperado', 'discharge_diagnosis' => 'Mejoría'])->assertSessionHasNoErrors();
    $this->actingAs($this->enfermera)->post("/internamiento/{$admission->id}/alta", ['type' => 'recuperado', 'discharge_diagnosis' => 'Mejoría'])->assertSessionHasErrors('admission');

    expect(Discharge::where('admission_id', $admission->id)->value('doctor_id'))->toBe($this->doctor->id);
});
