<?php

use App\Models\InventoryItem;
use App\Models\StockEntry;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->almacen = User::factory()->create(['name' => 'Pedro Almacén']);
    $this->almacen->assignRole('almacen');
    $this->enfermera = User::factory()->create();
    $this->enfermera->assignRole('enfermeria');

    $this->cibao = Supplier::create(['name' => 'Distribuidora Farmacéutica del Cibao']);
    $this->rowe = Supplier::create(['name' => 'Laboratorios Rowe']);
    $this->dipirona = InventoryItem::create([
        'code' => 'MED-001', 'name' => 'Dipirona', 'presentation' => '1 g/2 ml · ampolla',
        'kind' => 'medicamento', 'price' => 15000, 'stock' => 10, 'min_stock' => 20,
    ]);
});

function entryPayload(Supplier $supplier, array $lines, array $overrides = []): array
{
    return [
        'supplier_id' => $supplier->id,
        'invoice_ref' => 'B0100004512',
        'received_on' => today()->toDateString(),
        'lines' => $lines,
        ...$overrides,
    ];
}

test('an entry adds stock to the single catalog item and remembers the cost of each supplier', function () {
    $this->actingAs($this->almacen)
        ->post('/entrada-mercancia', entryPayload($this->cibao, [
            ['inventory_item_id' => $this->dipirona->id, 'quantity' => 60, 'lot' => 'L1302', 'expires_on' => '2027-06', 'unit_cost' => 6200],
        ]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->actingAs($this->almacen)
        ->post('/entrada-mercancia', entryPayload($this->rowe, [
            ['inventory_item_id' => $this->dipirona->id, 'quantity' => 30, 'lot' => 'R77', 'expires_on' => '2027-09', 'unit_cost' => 5800],
        ]))
        ->assertSessionHasNoErrors();

    $item = $this->dipirona->fresh();
    expect($item->stock)->toBe(100)
        ->and($item->cost)->toBe(5800)
        ->and($item->lot)->toBe('R77')
        ->and($item->expires_on->format('Y-m'))->toBe('2027-09')
        ->and($item->suppliers()->orderBy('name')->get()->map(fn ($s) => [$s->name, $s->pivot->last_cost])->all())
        ->toBe([['Distribuidora Farmacéutica del Cibao', 6200], ['Laboratorios Rowe', 5800]]);

    $entry = StockEntry::first();
    expect($entry->number)->toBe('ENT-0001')
        ->and($entry->units)->toBe(60)
        ->and($entry->total_cost)->toBe(60 * 6200)
        ->and($entry->created_by)->toBe($this->almacen->id)
        ->and(StockEntry::latest('id')->first()->number)->toBe('ENT-0002');
});

test('an entry can create a product that is not in the catalog', function () {
    $this->actingAs($this->almacen)
        ->post('/entrada-mercancia', entryPayload($this->cibao, [
            [
                'new_item' => ['name' => 'Gasa estéril 4x4', 'presentation' => 'Paquete de 10', 'kind' => 'insumo', 'price' => 2500, 'min_stock' => 30],
                'quantity' => 100, 'unit_cost' => 900,
            ],
        ]))
        ->assertSessionHasNoErrors();

    $gasa = InventoryItem::where('name', 'Gasa estéril 4x4')->first();
    expect($gasa->code)->toBe('INS-001')
        ->and($gasa->stock)->toBe(100)
        ->and($gasa->cost)->toBe(900)
        ->and($gasa->price)->toBe(2500)
        ->and($gasa->min_stock)->toBe(30);
});

test('an entry needs a supplier, lines with a quantity and a cost', function () {
    $this->actingAs($this->almacen)
        ->post('/entrada-mercancia', ['received_on' => today()->toDateString(), 'lines' => []])
        ->assertSessionHasErrors(['supplier_id', 'lines']);

    $this->actingAs($this->almacen)
        ->post('/entrada-mercancia', entryPayload($this->cibao, [
            ['inventory_item_id' => $this->dipirona->id, 'quantity' => 0, 'unit_cost' => -1, 'expires_on' => '06/2027'],
        ]))
        ->assertSessionHasErrors(['lines.0.quantity', 'lines.0.unit_cost', 'lines.0.expires_on']);

    expect($this->dipirona->fresh()->stock)->toBe(10);
});

test('the entry page lists the catalog, the active suppliers and the recent entries', function () {
    $this->actingAs($this->almacen)->post('/entrada-mercancia', entryPayload($this->cibao, [
        ['inventory_item_id' => $this->dipirona->id, 'quantity' => 5, 'unit_cost' => 6000],
    ]));

    $this->actingAs($this->almacen)
        ->get('/entrada-mercancia')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('entrada/index')
            ->has('items', 1)
            ->where('items.0.stock', 15)
            ->has('suppliers', 2)
            ->where('next_number', 'ENT-0002')
            ->has('recent', 1)
            ->where('recent.0.number', 'ENT-0001')
            ->where('recent.0.supplier', 'Distribuidora Farmacéutica del Cibao')
            ->where('recent.0.lines_count', 1)
            ->where('recent.0.total_cost', 30000)
        );
});

test('only the warehouse role and administrators register entries', function () {
    $this->actingAs($this->enfermera)->get('/entrada-mercancia')->assertForbidden();
    $this->actingAs($this->enfermera)
        ->post('/entrada-mercancia', entryPayload($this->cibao, [['inventory_item_id' => $this->dipirona->id, 'quantity' => 5, 'unit_cost' => 1]]))
        ->assertForbidden();
});

test('the inventory entries migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_04_100000_create_suppliers_and_stock_entries_tables.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('suppliers'))->toBeFalse()
        ->and(Schema::hasTable('stock_entries'))->toBeFalse()
        ->and(Schema::hasColumn('inventory_items', 'cost'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('stock_entry_lines'))->toBeTrue();
});
