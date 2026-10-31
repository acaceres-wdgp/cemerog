<?php

use App\Models\InventoryItem;
use App\Models\StockEntry;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\InventorySeeder;

test('the inventory seeder loads suppliers, medications and supplies, and can run twice', function () {
    User::factory()->create()->assignRole('administrador');

    $this->seed(InventorySeeder::class);
    $this->seed(InventorySeeder::class);

    expect(Supplier::count())->toBe(3)
        ->and(InventoryItem::where('kind', 'medicamento')->count())->toBe(9)
        ->and(InventoryItem::where('kind', 'insumo')->count())->toBe(8)
        ->and(StockEntry::count())->toBe(3)
        ->and(InventoryItem::where('name', 'Dipirona')->first()->stock)->toBe(141)
        ->and(InventoryItem::where('name', 'Dipirona')->first()->price)->toBe(15000)
        ->and(InventoryItem::where('name', 'Dipirona')->first()->suppliers()->count())->toBe(1);
});
