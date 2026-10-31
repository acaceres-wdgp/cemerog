<?php

namespace App\Actions\Inventario;

use App\Models\InventoryItem;
use App\Models\StockEntry;
use App\Models\StockEntryLine;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Goods entry: adds stock to each catalog item, keeps the last cost of the
 * supplier and, as the item's lot and expiry, those of this entry. A line may
 * create a product that is not in the catalog yet.
 */
class RegisterStockEntry
{
    /**
     * @param  list<array{inventory_item_id?: int|null, new_item?: array<string, mixed>|null, quantity: int, lot?: string|null, expires_on?: string|null, unit_cost: int}>  $lines
     */
    public function handle(Supplier $supplier, ?string $invoiceRef, Carbon $receivedOn, array $lines, User $user): StockEntry
    {
        return DB::transaction(function () use ($supplier, $invoiceRef, $receivedOn, $lines, $user): StockEntry {
            $entry = StockEntry::create([
                'supplier_id' => $supplier->id,
                'invoice_ref' => $invoiceRef,
                'received_on' => $receivedOn,
                'created_by' => $user->id,
            ]);
            $entry->update(['number' => sprintf('ENT-%04d', $entry->id)]);

            $units = 0;
            $total = 0;
            foreach ($lines as $line) {
                $item = $this->itemFor($line);
                $quantity = (int) $line['quantity'];
                $cost = (int) $line['unit_cost'];
                // «!» resets the day: 2027-09 is 1 Sept, not today's day of the month
                $expires = ! empty($line['expires_on']) ? Carbon::createFromFormat('!Y-m', $line['expires_on']) : null;
                $lot = ! empty($line['lot']) ? trim((string) $line['lot']) : null;

                StockEntryLine::create([
                    'stock_entry_id' => $entry->id,
                    'inventory_item_id' => $item->id,
                    'quantity' => $quantity,
                    'lot' => $lot,
                    'expires_on' => $expires,
                    'unit_cost' => $cost,
                    'subtotal' => $quantity * $cost,
                ]);

                $item->stock += $quantity;
                $item->cost = $cost;
                if ($lot !== null || $expires !== null) {
                    $item->lot = $lot;
                    $item->expires_on = $expires;
                }
                $item->save();

                $item->suppliers()->syncWithoutDetaching([
                    $supplier->id => ['last_cost' => $cost, 'last_entry_on' => $receivedOn->toDateString()],
                ]);

                $units += $quantity;
                $total += $quantity * $cost;
            }

            $entry->update(['units' => $units, 'total_cost' => $total]);

            return $entry;
        });
    }

    /** @param array<string, mixed> $line */
    private function itemFor(array $line): InventoryItem
    {
        if (! empty($line['inventory_item_id'])) {
            return InventoryItem::whereKey($line['inventory_item_id'])->lockForUpdate()->firstOrFail();
        }

        $new = (array) $line['new_item'];

        return InventoryItem::create([
            'code' => InventoryItem::nextCode((string) $new['kind']),
            'name' => trim((string) $new['name']),
            'presentation' => isset($new['presentation']) ? trim((string) $new['presentation']) : null,
            'kind' => $new['kind'],
            'price' => (int) $new['price'],
            'stock' => 0,
            'min_stock' => (int) ($new['min_stock'] ?? 0),
            'is_active' => true,
        ]);
    }
}
