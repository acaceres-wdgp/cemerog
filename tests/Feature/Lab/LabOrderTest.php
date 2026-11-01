<?php

use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\LabOrder;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Database\Seeders\LabCatalogSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->seed(LabCatalogSeeder::class);

    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'name' => 'Dr. Franklin Rodríguez',
        'user_id' => $this->medico->id,
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->enfermera = User::factory()->create();
    $this->enfermera->assignRole('enfermeria');
    $this->patient = Patient::factory()->create();

    $this->hemograma = LabTest::where('code', '104')->first();
    $this->glucosa = LabTest::where('code', '130')->first();
});

function consultTurn(Doctor $doctor, Patient $patient): Turn
{
    return Turn::factory()->create([
        'doctor_id' => $doctor->id,
        'patient_id' => $patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);
}

test('the doctor orders analyses from consulta; nothing is charged yet', function () {
    $turn = consultTurn($this->doctor, $this->patient);

    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$turn->id}/laboratorio", [
            'lab_test_ids' => [$this->hemograma->id, $this->glucosa->id],
            'indication' => 'Fiebre de 3 días.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $order = LabOrder::with('items')->first();
    expect($order->number)->toBe('L-0001')
        ->and($order->origin)->toBe('consulta')
        ->and($order->status)->toBe('ordenada')
        ->and($order->turn_id)->toBe($turn->id)
        ->and($order->patient_id)->toBe($this->patient->id)
        ->and($order->doctor_id)->toBe($this->doctor->id)
        ->and($order->indication)->toBe('Fiebre de 3 días.')
        ->and($order->items->pluck('name')->all())->toBe(['Hemograma completo', 'Glucosa en ayunas'])
        ->and($order->items->pluck('price')->all())->toBe([30000, 25000])
        ->and($order->items->pluck('account_charge_id')->filter()->all())->toBe([]);
});

test('only the doctor of the turn orders from consulta', function () {
    $turn = consultTurn($this->doctor, $this->patient);
    $other = User::factory()->create();
    $other->assignRole('medico');
    Doctor::factory()->create(['user_id' => $other->id, 'specialty_id' => $this->doctor->specialty_id, 'is_active' => true]);

    $this->actingAs($other)
        ->post("/consulta/turnos/{$turn->id}/laboratorio", ['lab_test_ids' => [$this->glucosa->id]])
        ->assertForbidden();
});

test('an order is made in emergency for the emergency doctor', function () {
    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', [
        'patient_id' => $this->patient->id,
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => $this->doctor->id,
        'reason' => 'Dolor torácico.',
    ]);
    $emergency = Emergency::first();

    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$emergency->id}/laboratorio", ['lab_test_ids' => [$this->hemograma->id]])
        ->assertSessionHasNoErrors();

    $order = LabOrder::first();
    expect($order->origin)->toBe('emergencia')
        ->and($order->emergency_id)->toBe($emergency->id)
        ->and($order->doctor_id)->toBe($this->doctor->id);

    $this->actingAs($this->enfermera)
        ->get("/emergencia/{$emergency->id}")
        ->assertInertia(fn ($page) => $page
            ->has('lab_orders', 1)
            ->where('lab_orders.0.number', 'L-0001')
            ->where('lab_orders.0.status', 'ordenada')
            ->where('lab_orders.0.tests', ['Hemograma completo'])
            ->has('lab_catalog', 9)
        );
});

test('an order needs at least one active analysis', function () {
    $turn = consultTurn($this->doctor, $this->patient);
    $this->glucosa->update(['is_active' => false]);

    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$turn->id}/laboratorio", ['lab_test_ids' => []])
        ->assertSessionHasErrors(['lab_test_ids']);
    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$turn->id}/laboratorio", ['lab_test_ids' => [$this->glucosa->id]])
        ->assertSessionHasErrors(['lab_test_ids.0']);
});

test('an order not started can be cancelled with a reason (e.g. done elsewhere)', function () {
    $turn = consultTurn($this->doctor, $this->patient);
    $this->actingAs($this->medico)->post("/consulta/turnos/{$turn->id}/laboratorio", ['lab_test_ids' => [$this->glucosa->id]]);
    $order = LabOrder::first();

    $this->actingAs($this->medico)
        ->post("/laboratorio/ordenes/{$order->id}/cancelar", ['reason' => ''])
        ->assertSessionHasErrors(['reason']);

    $this->actingAs($this->medico)
        ->post("/laboratorio/ordenes/{$order->id}/cancelar", ['reason' => 'Se lo hará en otro laboratorio'])
        ->assertSessionHasNoErrors();

    $order->refresh();
    expect($order->status)->toBe('cancelada')
        ->and($order->cancel_reason)->toBe('Se lo hará en otro laboratorio')
        ->and($order->cancelled_by)->toBe($this->medico->id);
});

test('consulta offers the lab catalog to the doctor', function () {
    consultTurn($this->doctor, $this->patient);

    $this->actingAs($this->medico)
        ->get('/consulta')
        ->assertInertia(fn ($page) => $page
            ->has('lab_catalog', 9)
            ->where('lab_catalog.0.category', 'Hematología')
        );
});

test('the lab orders migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_05_200000_create_lab_orders_tables.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('lab_orders'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('lab_order_items'))->toBeTrue();
});
