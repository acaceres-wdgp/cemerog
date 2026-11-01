<?php

use App\Actions\BuildClinicalHistory;
use App\Models\Account;
use App\Models\Doctor;
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
        'user_id' => $this->medico->id, 'specialty_id' => Specialty::factory()->create()->id, 'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();
    $this->turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id, 'status' => 'en_consulta', 'arrived_at' => now(),
    ]);
    Account::create(['patient_id' => $this->patient->id, 'service_date' => today()->toDateString(), 'status' => 'abierta', 'opened_at' => now()]);

    $this->actingAs($this->medico)->post("/consulta/turnos/{$this->turn->id}/laboratorio", [
        'lab_test_ids' => [LabTest::where('code', '130')->value('id')],
    ]);
    $this->order = LabOrder::first();
});

function validateOrder($test, string $value): void
{
    $test->actingAs($test->bio)->post("/laboratorio/ordenes/{$test->order->id}/muestra");
    $test->actingAs($test->bio)->post("/laboratorio/ordenes/{$test->order->id}/validar", ['results' => [LabResult::value('id') => $value]]);
}

test('consulta shows the patient\'s orders with their status and, once validated, the results', function () {
    $this->actingAs($this->medico)
        ->get("/consulta?patient_id={$this->patient->id}")
        ->assertInertia(fn ($page) => $page
            ->has('lab_orders', 1)
            ->where('lab_orders.0.status', 'ordenada')
            ->where('lab_orders.0.results', [])
        );

    validateOrder($this, '150');

    $this->actingAs($this->medico)
        ->get("/consulta?patient_id={$this->patient->id}")
        ->assertInertia(fn ($page) => $page
            ->where('lab_orders.0.status', 'validada')
            ->where('lab_orders.0.results.0.name', 'Glucosa en ayunas')
            ->where('lab_orders.0.results.0.value', '150')
            ->where('lab_orders.0.results.0.out_of_range', true)
        );
});

test('validated results are part of the clinical history', function () {
    validateOrder($this, '88');

    $entry = collect(app(BuildClinicalHistory::class)->handle($this->patient, $this->doctor))->firstWhere('type', 'laboratorio');

    expect($entry)->not->toBeNull()
        ->and($entry['mine'])->toBeTrue()
        ->and($entry['lab']['number'])->toBe($this->order->number)
        ->and($entry['lab']['tests'])->toBe(['Glucosa en ayunas'])
        ->and($entry['lab']['results'][0])->toMatchArray(['name' => 'Glucosa en ayunas', 'value' => '88', 'out_of_range' => false]);
});

test('orders still in progress are not in the clinical history', function () {
    $history = app(BuildClinicalHistory::class)->handle($this->patient, $this->doctor);

    expect(collect($history)->where('type', 'laboratorio'))->toHaveCount(0);
});
