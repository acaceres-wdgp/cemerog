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

test('the administrator adds a medication and it gets its code', function () {
    $this->actingAs($this->admin)
        ->post('/almacen/articulos', itemPayload())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $item = InventoryItem::first();
    expect($item->code)->toBe('MED-001')
        ->and($item->name)->toBe('Dipirona 1 g/2 ml')
        ->and($item->price)->toBe(15000)
        ->and($item->stock)->toBe(40)
        ->and($item->is_active)->toBeTrue();

    $this->actingAs($this->admin)->post('/almacen/articulos', itemPayload(['name' => 'Gasa estéril', 'kind' => 'insumo', 'price' => 2500]));
    $this->actingAs($this->admin)->post('/almacen/articulos', itemPayload(['name' => 'Ceftriaxona 1 g']));

    expect(InventoryItem::orderBy('id')->pluck('code')->all())->toBe(['MED-001', 'INS-001', 'MED-002']);
});

test('the catalog lists the items with a low-stock alert', function () {
    InventoryItem::create([...itemPayload(['stock' => 3]), 'code' => 'MED-001']);
    InventoryItem::create([...itemPayload(['name' => 'Algodón', 'kind' => 'insumo', 'stock' => 100]), 'code' => 'INS-001']);

    $this->actingAs($this->almacen)
        ->get('/almacen')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('almacen/index')
            ->has('items', 2)
            ->where('items.0.name', 'Algodón')
            ->where('items.1.low_stock', true)
            ->where('can_edit', false)
        );
});

test('only an administrator creates or edits items', function () {
    $this->actingAs($this->almacen)->post('/almacen/articulos', itemPayload())->assertForbidden();

    $item = InventoryItem::create([...itemPayload(), 'code' => 'MED-001']);
    $this->actingAs($this->almacen)->put("/almacen/articulos/{$item->id}", itemPayload(['price' => 1]))->assertForbidden();
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
    $this->actingAs($this->admin)
        ->post('/almacen/articulos', itemPayload(['name' => '', 'kind' => 'otro', 'price' => -5]))
        ->assertSessionHasErrors(['name', 'kind', 'price']);
});

test('the inventory items migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_03_100001_create_inventory_items_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('inventory_items'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('inventory_items'))->toBeTrue();
});
