<?php

namespace Database\Seeders;

use App\Actions\Inventario\RegisterStockEntry;
use App\Models\InventoryItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Suppliers and catalog to try Emergencia and Inventario. Safe to run more
 * than once: it skips what already exists.
 *
 *   php artisan db:seed --class=InventorySeeder
 */
class InventorySeeder extends Seeder
{
    /** [name, presentation, kind, stock, min, cost RD$, price RD$, lot, expires Y-m, supplier] */
    private const ITEMS = [
        ['Dipirona', '1 g/2 ml · ampolla', 'medicamento', 141, 50, 62, 150, 'L2307', '2027-08', 0],
        ['Clindamicina', '600 mg · ampolla', 'medicamento', 18, 30, 310, 600, 'L1188', '2027-03', 0],
        ['Ceftriaxona', '1 g · vial', 'medicamento', 36, 20, 180, 450, 'C5521', '2026-12', 1],
        ['Acetaminofén', '500 mg · tableta', 'medicamento', 820, 200, 3, 10, 'A9012', '2028-05', 2],
        ['Omeprazol', '40 mg · vial', 'medicamento', 9, 15, 140, 350, 'O3310', '2026-12', 1],
        ['Metilprednisolona', '125 mg · vial', 'medicamento', 12, 10, 160, 380, 'M7720', '2027-01', 0],
        ['Azitromicina', '500 mg · tableta', 'medicamento', 64, 30, 45, 120, 'Z4410', '2027-09', 2],
        ['Ketorolaco', '60 mg · ampolla', 'medicamento', 40, 25, 120, 350, 'K1180', '2026-12', 1],
        ['Salbutamol', '5 mg/ml · solución para nebulizar', 'medicamento', 25, 10, 90, 250, 'S4471', '2027-06', 0],
        ['Jeringa 10 CC', 'Unidad', 'insumo', 408, 100, 8, 25, null, null, 1],
        ['Catéter IV 20G', 'Unidad', 'insumo', 63, 40, 35, 90, 'C0412', null, 1],
        ['Solución salina 0.9 %', '1000 ml · frasco', 'insumo', 22, 40, 70, 180, 'S2290', '2027-02', 0],
        ['Guantes de examen', 'Caja de 100', 'insumo', 15, 10, 380, 650, 'G7781', null, 1],
        ['Mascarilla para nebulizar', 'Adulto · unidad', 'insumo', 27, 15, 95, 250, 'N1150', null, 1],
        ['Gasa estéril 4x4', 'Paquete de 10', 'insumo', 120, 30, 9, 25, null, null, 1],
        ['Algodón', '1 lb · rollo', 'insumo', 12, 5, 75, 120, null, null, 1],
        ['Alcohol isopropílico 70 %', '500 ml · frasco', 'insumo', 18, 6, 60, 110, null, null, 1],
    ];

    private const SUPPLIERS = [
        ['Distribuidora Farmacéutica del Cibao', '101-55321-8', '809-575-1020', 'Luis Peña'],
        ['Suministros Médicos Montecristi', '131-20877-4', '809-579-3344', 'Carmen Ureña'],
        ['Laboratorios Rowe', '101-00327-1', '809-562-4040', 'Ventas institucionales'],
    ];

    public function run(): void
    {
        $user = User::role('administrador')->first() ?? User::first();
        if ($user === null) {
            $this->say('No hay usuarios: corre primero RolesAndPermissionsSeeder y AdminUserSeeder.');

            return;
        }

        $suppliers = array_map(fn (array $s): Supplier => Supplier::firstOrCreate(
            ['name' => $s[0]],
            ['rnc' => $s[1], 'phone' => $s[2], 'contact' => $s[3], 'is_active' => true],
        ), self::SUPPLIERS);

        // One goods entry per supplier with its new products
        $lines = [];
        foreach (self::ITEMS as [$name, $presentation, $kind, $stock, $min, $cost, $price, $lot, $expires, $supplier]) {
            if (InventoryItem::where('name', $name)->exists()) {
                continue;
            }
            $lines[$supplier][] = [
                'new_item' => ['name' => $name, 'presentation' => $presentation, 'kind' => $kind, 'price' => $price * 100, 'min_stock' => $min],
                'quantity' => $stock,
                'lot' => $lot,
                'expires_on' => $expires,
                'unit_cost' => $cost * 100,
            ];
        }

        $action = app(RegisterStockEntry::class);
        foreach ($lines as $index => $supplierLines) {
            $action->handle($suppliers[$index], 'B01000'.str_pad((string) ($index + 1), 5, '0', STR_PAD_LEFT), Carbon::today()->subDays(7 - $index), $supplierLines, $user);
        }

        $this->say('Inventario de prueba: '.InventoryItem::count().' artículos, '.count($suppliers).' proveedores.');
    }

    private function say(string $message): void
    {
        $this->command->info($message);
    }
}
