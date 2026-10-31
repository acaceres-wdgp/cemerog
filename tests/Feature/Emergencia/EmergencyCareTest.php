<?php

use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyApplication;
use App\Models\EmergencyCubicle;
use App\Models\EmergencyVital;
use App\Models\InventoryItem;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->enfermera = User::factory()->create(['name' => 'Lic. Yaniris Cabrera']);
    $this->enfermera->assignRole('enfermeria');
    Doctor::factory()->create(['specialty_id' => Specialty::factory()->create()->id, 'is_active' => true]);

    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', [
        'patient_id' => Patient::factory()->create()->id,
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => Doctor::value('id'),
        'reason' => 'Dificultad respiratoria.',
    ])->assertSessionHasNoErrors();
    $this->emergency = Emergency::first();

    $this->dipirona = InventoryItem::create([
        'code' => 'MED-001', 'name' => 'Dipirona 1 g/2 ml', 'presentation' => 'Ampolla',
        'kind' => 'medicamento', 'price' => 15000, 'stock' => 10, 'min_stock' => 2,
    ]);
    $this->gasa = InventoryItem::create([
        'code' => 'INS-001', 'name' => 'Gasa estéril 4x4', 'kind' => 'insumo', 'price' => 2500, 'stock' => 1, 'min_stock' => 5,
    ]);
});

test('vital signs are recorded with the time and who took them', function () {
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/signos-vitales", [
            'presion_arterial' => '145/90', 'frecuencia_cardiaca' => 98, 'frecuencia_respiratoria' => 22,
            'temp' => 38.4, 'saturacion_o2' => 93, 'glucemia' => null,
        ])
        ->assertSessionHasNoErrors();

    $vital = EmergencyVital::first();
    expect($vital->presion_arterial)->toBe('145/90')
        ->and($vital->temp)->toBe(384)
        ->and($vital->glucemia)->toBeNull()
        ->and($vital->taken_by)->toBe($this->enfermera->id);

    $this->actingAs($this->enfermera)
        ->get("/emergencia/{$this->emergency->id}")
        ->assertInertia(fn ($page) => $page
            ->has('vitals', 1)
            ->where('vitals.0.presion_arterial', '145/90')
            ->where('vitals.0.temp', 38.4)
            ->where('vitals.0.taken_by', 'Lic. Yaniris Cabrera')
        );

    $this->actingAs($this->enfermera)
        ->get('/emergencia')
        ->assertInertia(fn ($page) => $page->where('emergencies.0.last_vital', 'PA 145/90 · FC 98 · SpO₂ 93 %'));
});

test('the required vital signs are validated', function () {
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/signos-vitales", ['presion_arterial' => 'alta', 'saturacion_o2' => 140])
        ->assertSessionHasErrors(['presion_arterial', 'frecuencia_cardiaca', 'frecuencia_respiratoria', 'temp', 'saturacion_o2']);
});

test('a medication from the catalog discounts stock and is charged to the account', function () {
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/aplicaciones", [
            'kind' => 'medicamento', 'inventory_item_id' => $this->dipirona->id, 'quantity' => 2, 'route' => 'IV',
        ])
        ->assertSessionHasNoErrors();

    $application = EmergencyApplication::first();
    expect($application->description)->toBe('Dipirona 1 g/2 ml')
        ->and($application->total)->toBe(30000)
        ->and($application->route)->toBe('IV')
        ->and($application->applied_by)->toBe($this->enfermera->id)
        ->and($this->dipirona->fresh()->stock)->toBe(8);

    $charge = AccountCharge::where('type', 'medicamento')->first();
    expect($charge->account_id)->toBe($this->emergency->account_id)
        ->and($charge->description)->toBe('Dipirona 1 g/2 ml')
        ->and($charge->quantity)->toBe(2)
        ->and($charge->total)->toBe(30000)
        ->and($charge->source_id)->toBe($application->id);
});

test('a supply is charged even when the stock runs out', function () {
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/aplicaciones", [
            'kind' => 'insumo', 'inventory_item_id' => $this->gasa->id, 'quantity' => 3,
        ])
        ->assertSessionHasNoErrors();

    expect($this->gasa->fresh()->stock)->toBe(-2)
        ->and(AccountCharge::where('type', 'insumo')->value('total'))->toBe(7500);
});

test('a medication brought by the patient is recorded without charge or stock', function () {
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/aplicaciones", [
            'kind' => 'medicamento', 'brought_by_patient' => true, 'description' => 'Salbutamol inhalador propio', 'quantity' => 1, 'route' => 'Inhalada',
        ])
        ->assertSessionHasNoErrors();

    $application = EmergencyApplication::first();
    expect($application->brought_by_patient)->toBeTrue()
        ->and($application->inventory_item_id)->toBeNull()
        ->and($application->total)->toBe(0)
        ->and(AccountCharge::where('type', 'medicamento')->count())->toBe(0);
});

test('the item must match the kind and be active', function () {
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/aplicaciones", ['kind' => 'medicamento', 'inventory_item_id' => $this->gasa->id, 'quantity' => 1])
        ->assertSessionHasErrors(['inventory_item_id']);

    $this->dipirona->update(['is_active' => false]);
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/aplicaciones", ['kind' => 'medicamento', 'inventory_item_id' => $this->dipirona->id, 'quantity' => 1])
        ->assertSessionHasErrors(['inventory_item_id']);

    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/aplicaciones", ['kind' => 'medicamento', 'brought_by_patient' => true, 'quantity' => 0])
        ->assertSessionHasErrors(['description', 'quantity']);
});

test('the detail lists medications, supplies and the catalog to apply', function () {
    $this->actingAs($this->enfermera)->post("/emergencia/{$this->emergency->id}/aplicaciones", [
        'kind' => 'medicamento', 'inventory_item_id' => $this->dipirona->id, 'quantity' => 1, 'route' => 'IM',
    ]);
    $this->actingAs($this->enfermera)->post("/emergencia/{$this->emergency->id}/aplicaciones", [
        'kind' => 'insumo', 'inventory_item_id' => $this->gasa->id, 'quantity' => 2,
    ]);

    $this->actingAs($this->enfermera)
        ->get("/emergencia/{$this->emergency->id}")
        ->assertInertia(fn ($page) => $page
            ->has('applications', 2)
            ->where('applications.0.kind', 'medicamento')
            ->where('applications.0.applied_by', 'Lic. Yaniris Cabrera')
            ->where('applications.0.stock_left', 9)
            ->where('applications.1.kind', 'insumo')
            ->has('catalog', 2)
            ->where('catalog.0.name', 'Dipirona 1 g/2 ml')
            ->where('emergency.account.total', 150000 + 15000 + 5000)
            ->where('emergency.account.charges_count', 3)
        );
});

test('nothing is recorded after the discharge', function () {
    $this->emergency->update(['status' => 'alta', 'occupied_cubicle_id' => null]);

    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/aplicaciones", ['kind' => 'insumo', 'inventory_item_id' => $this->gasa->id, 'quantity' => 1])
        ->assertSessionHasErrors(['emergency']);
});

test('the vitals and applications migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_03_300000_create_emergency_vitals_and_applications_tables.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('emergency_vitals'))->toBeFalse()
        ->and(Schema::hasTable('emergency_applications'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('emergency_applications'))->toBeTrue();
});
