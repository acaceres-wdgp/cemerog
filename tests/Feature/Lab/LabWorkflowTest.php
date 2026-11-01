<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\LabOrder;
use App\Models\LabResult;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Database\Seeders\LabCatalogSeeder;

beforeEach(function () {
    $this->seed(LabCatalogSeeder::class);

    $this->bio = User::factory()->create(['name' => 'Lic. Rubén Sosa']);
    $this->bio->assignRole('bioanalista');
    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'name' => 'Dr. Franklin Rodríguez',
        'user_id' => $this->medico->id,
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
        'consultation_price' => 150000,
    ]);
    $this->patient = Patient::factory()->create(['first_names' => 'Rosa María', 'last_names' => 'Peña']);
    $this->glucosa = LabTest::where('code', '130')->first();
    $this->gestatest = LabTest::where('code', '109')->first();
});

/** An order from a consult turn with an open daily account */
function orderFromConsult($test, array $tests): LabOrder
{
    $turn = Turn::factory()->create([
        'doctor_id' => $test->doctor->id, 'patient_id' => $test->patient->id, 'status' => 'en_consulta', 'arrived_at' => now(),
    ]);
    Account::create(['patient_id' => $test->patient->id, 'service_date' => today()->toDateString(), 'status' => 'abierta', 'opened_at' => now()]);

    $test->actingAs($test->medico)
        ->post("/consulta/turnos/{$turn->id}/laboratorio", ['lab_test_ids' => array_map(fn ($t) => $t->id, $tests)])
        ->assertSessionHasNoErrors();

    return LabOrder::latest('id')->first();
}

test('the queue shows today\'s orders by status', function () {
    $order = orderFromConsult($this, [$this->glucosa, $this->gestatest]);

    $this->actingAs($this->bio)
        ->get('/laboratorio')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('lab/index')
            ->where('view', 'hoy')
            ->has('orders', 1)
            ->where('orders.0.number', $order->number)
            ->where('orders.0.status', 'ordenada')
            ->where('orders.0.patient.full_name', 'Rosa María Peña')
            ->where('orders.0.origin', 'Consulta')
            ->where('orders.0.doctor', 'Dr. Franklin Rodríguez')
            ->where('orders.0.tests', ['Glucosa en ayunas', 'Gestatest'])
            ->where('counts.ordenada', 1)
        );
});

test('taking the sample charges each analysis to the patient\'s account and prepares the results', function () {
    $order = orderFromConsult($this, [$this->glucosa, $this->gestatest]);

    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/muestra")->assertSessionHasNoErrors();

    $order->refresh();
    expect($order->status)->toBe('muestra')
        ->and($order->sample_by)->toBe($this->bio->id)
        ->and($order->sample_at)->not->toBeNull();

    $charges = AccountCharge::where('type', 'laboratorio')->orderBy('id')->get();
    expect($charges->pluck('description')->all())->toBe(['Glucosa en ayunas', 'Gestatest'])
        ->and($charges->pluck('total')->all())->toBe([25000, 30000])
        ->and($charges->first()->account->patient_id)->toBe($this->patient->id)
        ->and($order->items()->whereNull('account_charge_id')->count())->toBe(0)
        ->and(LabResult::count())->toBe(2)
        ->and(LabResult::first()->reference)->toBe('70 – 100 mg/dL');

    // Twice is not allowed
    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/muestra")->assertSessionHasErrors(['order']);
    expect(AccountCharge::where('type', 'laboratorio')->count())->toBe(2);
});

test('an emergency order is charged to the emergency account', function () {
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');
    $this->actingAs($enfermera)->post('/emergencia/ingreso', [
        'patient_id' => $this->patient->id,
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => $this->doctor->id,
        'reason' => 'Fiebre.',
    ]);
    $emergency = Emergency::first();
    $this->actingAs($enfermera)->post("/emergencia/{$emergency->id}/laboratorio", ['lab_test_ids' => [$this->glucosa->id]]);

    $this->actingAs($this->bio)->post('/laboratorio/ordenes/'.LabOrder::value('id').'/muestra')->assertSessionHasNoErrors();

    expect(AccountCharge::where('type', 'laboratorio')->value('account_id'))->toBe($emergency->account_id);
});

test('results are saved, flagged out of range and validated by the bioanalyst', function () {
    $order = orderFromConsult($this, [$this->glucosa, $this->gestatest]);
    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/muestra");
    [$glucose, $gestatest] = LabResult::orderBy('id')->get()->all();

    $this->actingAs($this->bio)
        ->post("/laboratorio/ordenes/{$order->id}/resultados", ['results' => [$glucose->id => '126']])
        ->assertSessionHasNoErrors();
    expect($order->fresh()->status)->toBe('ingresado')
        ->and($glucose->fresh()->value)->toBe('126')
        ->and($glucose->fresh()->out_of_range)->toBeTrue();

    // Validating needs every result
    $this->actingAs($this->bio)
        ->post("/laboratorio/ordenes/{$order->id}/validar", ['results' => [$glucose->id => '126']])
        ->assertSessionHasErrors(['results']);

    $this->actingAs($this->bio)
        ->post("/laboratorio/ordenes/{$order->id}/validar", ['results' => [$glucose->id => '126', $gestatest->id => 'negativo']])
        ->assertSessionHasNoErrors();

    $order->refresh();
    expect($order->status)->toBe('validada')
        ->and($order->validated_by)->toBe($this->bio->id)
        ->and($gestatest->fresh()->value)->toBe('NEGATIVO')
        ->and($gestatest->fresh()->out_of_range)->toBeFalse();

    // A validated result is not edited
    $this->actingAs($this->bio)
        ->post("/laboratorio/ordenes/{$order->id}/resultados", ['results' => [$glucose->id => '90']])
        ->assertSessionHasErrors(['order']);

    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/entregar")->assertSessionHasNoErrors();
    expect($order->fresh()->status)->toBe('entregada')->and($order->fresh()->delivered_at)->not->toBeNull();
});

test('only the bioanalyst or an administrator validates', function () {
    $order = orderFromConsult($this, [$this->glucosa]);
    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/muestra");
    $result = LabResult::first();

    $this->actingAs($this->medico)
        ->post("/laboratorio/ordenes/{$order->id}/validar", ['results' => [$result->id => '90']])
        ->assertForbidden();
});

test('the result detail shows the results by category with their flags', function () {
    $order = orderFromConsult($this, [$this->glucosa, $this->gestatest]);
    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/muestra");
    $glucose = LabResult::orderBy('id')->first();
    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/resultados", ['results' => [$glucose->id => '55']]);

    $this->actingAs($this->bio)
        ->get("/laboratorio/ordenes/{$order->id}")
        ->assertInertia(fn ($page) => $page
            ->component('lab/show')
            ->where('order.status', 'ingresado')
            ->where('order.can_validate', true)
            ->has('order.categories', 2)
            ->where('order.categories.0.category', 'Química')
            ->where('order.categories.0.results.0.value', '55')
            ->where('order.categories.0.results.0.out_of_range', true)
            ->where('order.categories.1.results.0.reference', 'NEGATIVO')
        );

    $this->actingAs($this->bio)
        ->get("/laboratorio/ordenes/{$order->id}/imprimir")
        ->assertInertia(fn ($page) => $page->component('lab/imprimir')->where('order.number', $order->number));
});

test('the history lists validated orders and can search by patient or order', function () {
    $order = orderFromConsult($this, [$this->glucosa]);
    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/muestra");
    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/validar", ['results' => [LabResult::value('id') => '150']]);

    $this->actingAs($this->bio)
        ->get('/laboratorio?vista=historial&q=Rosa')
        ->assertInertia(fn ($page) => $page
            ->where('view', 'historial')
            ->has('history.data', 1)
            ->where('history.data.0.number', $order->number)
            ->where('history.data.0.has_out_of_range', true)
        );

    $this->actingAs($this->bio)
        ->get('/laboratorio?vista=historial&q=Nadie')
        ->assertInertia(fn ($page) => $page->has('history.data', 0));
});

test('a patient with nothing else open goes to billing with the lab charges', function () {
    $order = orderFromConsult($this, [$this->glucosa]);
    Turn::where('patient_id', $this->patient->id)->update(['status' => 'atendido']);
    Account::query()->update(['status' => 'pendiente_facturar']);

    $this->actingAs($this->bio)->post("/laboratorio/ordenes/{$order->id}/muestra")->assertSessionHasNoErrors();

    $account = Account::first();
    expect(Account::count())->toBe(1)
        ->and($account->status)->toBe('pendiente_facturar')
        ->and($account->charges()->where('type', 'laboratorio')->count())->toBe(1);
});
