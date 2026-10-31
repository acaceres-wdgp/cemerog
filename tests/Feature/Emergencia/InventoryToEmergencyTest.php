<?php

use App\Models\Account;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\InventoryItem;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Supplier;
use App\Models\User;

/**
 * End to end: what the warehouse registers is available in Emergencia, and
 * what is applied there is charged to the patient's account and billed.
 */
test('a product received in a goods entry is applied in emergency and billed to the patient', function () {
    $almacen = User::factory()->create();
    $almacen->assignRole('almacen');
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');
    $cajero = User::factory()->create();
    $cajero->assignRole('caja');
    $doctor = Doctor::factory()->create(['specialty_id' => Specialty::factory()->create()->id, 'is_active' => true]);
    $supplier = Supplier::create(['name' => 'Laboratorios Rowe']);

    // 1. The warehouse receives a medication that was not in the catalog
    $this->actingAs($almacen)->post('/entrada-mercancia', [
        'supplier_id' => $supplier->id,
        'received_on' => today()->toDateString(),
        'lines' => [[
            'new_item' => ['name' => 'Ketorolaco', 'presentation' => '60 mg · ampolla', 'kind' => 'medicamento', 'price' => 35000],
            'quantity' => 10,
            'unit_cost' => 12000,
        ]],
    ])->assertSessionHasNoErrors();
    $ketorolaco = InventoryItem::where('name', 'Ketorolaco')->firstOrFail();

    // 2. A patient arrives in emergency: the new product is offered to apply
    $patient = Patient::factory()->create();
    $this->actingAs($enfermera)->post('/emergencia/ingreso', [
        'patient_id' => $patient->id,
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => $doctor->id,
        'reason' => 'Dolor abdominal.',
    ])->assertSessionHasNoErrors();
    $emergency = Emergency::firstOrFail();

    $this->actingAs($enfermera)
        ->get("/emergencia/{$emergency->id}")
        ->assertInertia(fn ($page) => $page
            ->where('catalog.0.id', $ketorolaco->id)
            ->where('catalog.0.stock', 10)
            ->where('catalog.0.price', 35000)
        );

    // 3. Applied: stock goes down and the charge goes to the patient's account
    $this->actingAs($enfermera)->post("/emergencia/{$emergency->id}/aplicaciones", [
        'kind' => 'medicamento', 'inventory_item_id' => $ketorolaco->id, 'quantity' => 2, 'route' => 'IM',
    ])->assertSessionHasNoErrors();

    expect($ketorolaco->fresh()->stock)->toBe(8);
    $account = Account::findOrFail($emergency->account_id);
    expect($account->patient_id)->toBe($patient->id)
        ->and($account->charges()->where('type', 'medicamento')->value('total'))->toBe(70000)
        ->and((int) $account->charges()->sum('total'))->toBe(150000 + 70000);

    // 4. After the discharge the account reaches Facturación with that charge
    $this->actingAs($enfermera)->post("/emergencia/{$emergency->id}/alta", [
        'type' => 'recuperado', 'discharge_diagnosis' => 'Estable.',
    ])->assertSessionHasNoErrors();

    $this->actingAs($cajero)
        ->get('/facturacion')
        ->assertInertia(fn ($page) => $page
            ->where('pending_accounts.0.id', $account->id)
            ->where('pending_accounts.0.total', 220000)
            ->where('pending_accounts.0.charges.1.description', 'Ketorolaco')
            ->where('pending_accounts.0.charges.1.area', 'Farmacia')
        );
});

test('a product deactivated in the catalog is no longer offered in emergency', function () {
    $item = InventoryItem::create([
        'code' => 'INS-001', 'name' => 'Gasa', 'kind' => 'insumo', 'price' => 2500, 'stock' => 5, 'min_stock' => 0, 'is_active' => false,
    ]);
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');
    $doctor = Doctor::factory()->create(['specialty_id' => Specialty::factory()->create()->id, 'is_active' => true]);
    $this->actingAs($enfermera)->post('/emergencia/ingreso', [
        'patient_id' => Patient::factory()->create()->id,
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => $doctor->id,
        'reason' => 'Herida.',
    ]);

    $this->actingAs($enfermera)
        ->get('/emergencia/'.Emergency::value('id'))
        ->assertInertia(fn ($page) => $page->has('catalog', 0));

    $item->update(['is_active' => true]);
    $this->actingAs($enfermera)
        ->get('/emergencia/'.Emergency::value('id'))
        ->assertInertia(fn ($page) => $page->has('catalog', 1));
});
