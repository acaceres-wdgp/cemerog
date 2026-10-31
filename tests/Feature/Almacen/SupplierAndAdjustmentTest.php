<?php

use App\Models\InventoryAdjustment;
use App\Models\InventoryItem;
use App\Models\Supplier;
use App\Models\User;

beforeEach(function () {
    $this->almacen = User::factory()->create();
    $this->almacen->assignRole('almacen');
    $this->item = InventoryItem::create([
        'code' => 'MED-001', 'name' => 'Ceftriaxona', 'presentation' => '1 g · vial',
        'kind' => 'medicamento', 'price' => 45000, 'stock' => -2, 'min_stock' => 5,
    ]);
});

test('suppliers are registered and edited', function () {
    $this->actingAs($this->almacen)
        ->post('/almacen/proveedores', ['name' => 'Laboratorios Rowe', 'rnc' => '101-00000-1', 'phone' => '809-555-0101', 'contact' => 'Ana'])
        ->assertSessionHasNoErrors();

    $supplier = Supplier::first();
    expect($supplier->name)->toBe('Laboratorios Rowe')->and($supplier->is_active)->toBeTrue();

    $this->actingAs($this->almacen)
        ->post('/almacen/proveedores', ['name' => 'Laboratorios Rowe'])
        ->assertSessionHasErrors(['name']);

    $this->actingAs($this->almacen)
        ->put("/almacen/proveedores/{$supplier->id}", ['name' => 'Laboratorios Rowe, S.A.', 'is_active' => false])
        ->assertSessionHasNoErrors();
    expect($supplier->fresh()->name)->toBe('Laboratorios Rowe, S.A.')->and($supplier->fresh()->is_active)->toBeFalse();

    $this->actingAs($this->almacen)
        ->get('/almacen/proveedores')
        ->assertInertia(fn ($page) => $page->component('almacen/proveedores')->has('suppliers', 1));
});

test('a physical count adjusts the stock with a reason and keeps the record', function () {
    $this->actingAs($this->almacen)
        ->post("/almacen/articulos/{$this->item->id}/ajustes", ['new_stock' => 12, 'reason' => 'conteo', 'note' => 'Conteo del viernes'])
        ->assertSessionHasNoErrors();

    $adjustment = InventoryAdjustment::first();
    expect($this->item->fresh()->stock)->toBe(12)
        ->and($adjustment->stock_before)->toBe(-2)
        ->and($adjustment->quantity)->toBe(14)
        ->and($adjustment->reason)->toBe('conteo');

    $this->actingAs($this->almacen)
        ->post("/almacen/articulos/{$this->item->id}/ajustes", ['new_stock' => 12, 'reason' => 'otro'])
        ->assertSessionHasErrors(['new_stock', 'reason']);
});

test('the warehouse role edits the catalog; other roles only see it if they have access', function () {
    $this->actingAs($this->almacen)
        ->put("/almacen/articulos/{$this->item->id}", [
            'name' => 'Ceftriaxona', 'kind' => 'medicamento', 'price' => 50000, 'stock' => -2, 'min_stock' => 5,
        ])
        ->assertSessionHasNoErrors();
    expect($this->item->fresh()->price)->toBe(50000);

    $this->actingAs($this->almacen)
        ->get('/almacen')
        ->assertInertia(fn ($page) => $page->where('can_edit', true));
});
