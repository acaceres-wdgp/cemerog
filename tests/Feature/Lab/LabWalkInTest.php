<?php

use App\Models\AccountCharge;
use App\Models\LabOrder;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;
use Database\Seeders\LabCatalogSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(LabCatalogSeeder::class);
    $this->recepcion = User::factory()->create();
    $this->recepcion->givePermissionTo('module.registro.access');
    $this->hemograma = LabTest::where('code', '104')->first();
    $this->glucosa = LabTest::where('code', '130')->first();
});

function walkInPayload(array $tests, array $extra = []): array
{
    return [
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
        'first_names' => 'Ana',
        'last_names' => 'Pérez',
        'birth_date' => '1990-05-15',
        'sex' => 'F',
        'phone' => '809-555-0001',
        'attention_type' => 'analisis',
        'lab_test_ids' => $tests,
        ...$extra,
    ];
}

test('registro offers the active lab catalog and opens on «estudios» from the lab button', function () {
    LabTest::where('code', '120')->update(['is_active' => false]);

    $this->actingAs($this->recepcion)
        ->get('/registro?tipo=estudios')
        ->assertInertia(fn (Assert $page) => $page
            ->component('registro/index')
            ->where('initialType', 'analisis')
            ->has('labCatalog', LabTest::where('is_active', true)->count())
        );

    $this->actingAs($this->recepcion)
        ->get('/registro')
        ->assertInertia(fn (Assert $page) => $page->where('initialType', 'consulta'));
});

test('a walk-in patient is registered with a lab order without consulta and nothing is charged', function () {
    $this->actingAs($this->recepcion)
        ->post('/registro', walkInPayload(
            [$this->hemograma->id, $this->glucosa->id],
            ['external_doctor' => 'Dra. Pérez (externa)'],
        ))
        ->assertRedirect('/pacientes')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success');

    $patient = Patient::where('first_names', 'Ana')->firstOrFail();
    $order = LabOrder::with('items')->firstOrFail();

    expect($order->patient_id)->toBe($patient->id)
        ->and($order->origin)->toBe('externo')
        ->and($order->status)->toBe('ordenada')
        ->and($order->external_doctor)->toBe('Dra. Pérez (externa)')
        ->and($order->items->pluck('name')->all())->toBe([$this->hemograma->name, $this->glucosa->name])
        ->and(Turn::count())->toBe(0)
        ->and(AccountCharge::count())->toBe(0);
});

test('a user with lab access goes straight to the lab queue', function () {
    $this->recepcion->givePermissionTo('module.lab.access');
    $patient = Patient::factory()->create();

    $this->actingAs($this->recepcion)
        ->post('/registro', [
            'patient_id' => $patient->id,
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'attention_type' => 'analisis',
            'lab_test_ids' => [$this->glucosa->id],
        ])
        ->assertRedirect('/laboratorio');

    expect(LabOrder::first()->patient_id)->toBe($patient->id);
});

test('a walk-in order needs at least one active analysis and no doctor', function () {
    LabTest::where('id', $this->glucosa->id)->update(['is_active' => false]);

    $this->actingAs($this->recepcion)
        ->post('/registro', walkInPayload([]))
        ->assertSessionHasErrors('lab_test_ids');

    $this->actingAs($this->recepcion)
        ->post('/registro', walkInPayload([$this->glucosa->id]))
        ->assertSessionHasErrors('lab_test_ids.0');

    expect(LabOrder::count())->toBe(0)
        ->and(Patient::count())->toBe(0);
});

test('a consulta still requires a doctor', function () {
    $this->actingAs($this->recepcion)
        ->post('/registro', walkInPayload([], ['attention_type' => 'consulta']))
        ->assertSessionHasErrors('doctor_id');
});
