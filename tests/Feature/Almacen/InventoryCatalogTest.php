<?php

use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
    $this->almacen = User::factory()->create();
    $this->almacen->assignRole('almacen');
});

function itemPayload(array $overrides = []): array
{
    return [
        'name' => 'Dipirona 1 g/2 ml',
        'presentation' => 'Ampolla',
        'kind' => 'medicamento',
        'price' => 15000,
        'stock' => 40,
        'min_stock' => 10,
        ...$overrides,
    ];
}

test('new items only come in through «Entrada de mercancía», not from the catalog', function () {
    $this->actingAs($this->admin)
        ->post('/almacen/articulos', itemPayload())
        ->assertNotFound();

    expect(InventoryItem::count())->toBe(0);
});

test('the catalog lists the items with low-stock and expiry alerts, cost and lot', function () {
    InventoryItem::create([...itemPayload(['stock' => 3]), 'code' => 'MED-001', 'cost' => 6200, 'lot' => 'L1302', 'expires_on' => today()->addMonths(2)->startOfMonth()]);
    InventoryItem::create([...itemPayload(['name' => 'Algodón', 'kind' => 'insumo', 'stock' => 100]), 'code' => 'INS-001']);

    $this->actingAs($this->almacen)
        ->get('/almacen')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('almacen/index')
            ->has('items', 2)
            ->where('items.0.name', 'Algodón')
            ->where('items.1.low_stock', true)
            ->where('items.1.cost', 6200)
            ->where('items.1.lot', 'L1302')
            ->where('items.1.expires_on', today()->addMonths(2)->format('m/Y'))
            ->where('items.1.expires_soon', true)
            ->where('items.0.expires_soon', false)
            ->where('can_edit', true)
        );
});

test('only the warehouse role and administrators edit items', function () {
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');

    $item = InventoryItem::create([...itemPayload(), 'code' => 'MED-001']);
    $this->actingAs($enfermera)->put("/almacen/articulos/{$item->id}", itemPayload(['price' => 1]))->assertForbidden();
});

test('editing an item never changes its stock', function () {
    $item = InventoryItem::create([...itemPayload(), 'code' => 'MED-001']);

    $this->actingAs($this->admin)
        ->put("/almacen/articulos/{$item->id}", itemPayload(['stock' => 999, 'price' => 16000]))
        ->assertSessionHasNoErrors();

    expect($item->fresh()->stock)->toBe(40)->and($item->fresh()->price)->toBe(16000);
});

test('an item can be edited and deactivated; the code does not change', function () {
    $item = InventoryItem::create([...itemPayload(), 'code' => 'MED-001']);

    $this->actingAs($this->admin)
        ->put("/almacen/articulos/{$item->id}", itemPayload(['price' => 18000, 'kind' => 'insumo', 'is_active' => false]))
        ->assertSessionHasNoErrors();

    $item->refresh();
    expect($item->price)->toBe(18000)
        ->and($item->kind)->toBe('insumo')
        ->and($item->code)->toBe('MED-001')
        ->and($item->is_active)->toBeFalse();
});

test('an item needs a name, a kind and a price in centavos', function () {
    $item = InventoryItem::create([...itemPayload(), 'code' => 'MED-001']);

    $this->actingAs($this->admin)
        ->put("/almacen/articulos/{$item->id}", itemPayload(['name' => '', 'kind' => 'otro', 'price' => -5]))
        ->assertSessionHasErrors(['name', 'kind', 'price']);
});

test('the inventory items migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_03_100001_create_inventory_items_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('inventory_items'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('inventory_items'))->toBeTrue();
});
