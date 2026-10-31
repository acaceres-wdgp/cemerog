<?php

namespace App\Actions\Emergencia;

use App\Models\AccountCharge;
use App\Models\Emergency;
use App\Models\EmergencyApplication;
use App\Models\InventoryItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * A medication or supply applied in emergency. From the catalog it
 * discounts stock (never blocking) and is charged to the account of the
 * attention; one brought by the patient is only recorded.
 */
class ApplyToEmergency
{
    public function handle(Emergency $emergency, User $user, string $kind, ?int $itemId, ?string $description, int $quantity, ?string $route): EmergencyApplication
    {
        return DB::transaction(function () use ($emergency, $user, $kind, $itemId, $description, $quantity, $route): EmergencyApplication {
            EnsureEmergencyActive::check($emergency);

            if ($itemId === null) {
                return EmergencyApplication::create([
                    'emergency_id' => $emergency->id,
                    'kind' => $kind,
                    'description' => trim((string) $description),
                    'quantity' => $quantity,
                    'route' => $route,
                    'brought_by_patient' => true,
                    'applied_at' => now(),
                    'applied_by' => $user->id,
                ]);
            }

            $item = InventoryItem::whereKey($itemId)->lockForUpdate()->firstOrFail();
            $item->decrement('stock', $quantity);
            $total = $item->price * $quantity;

            $application = EmergencyApplication::create([
                'emergency_id' => $emergency->id,
                'kind' => $kind,
                'inventory_item_id' => $item->id,
                'description' => $item->name,
                'quantity' => $quantity,
                'route' => $route,
                'unit_price' => $item->price,
                'total' => $total,
                'stock_left' => $item->stock,
                'applied_at' => now(),
                'applied_by' => $user->id,
            ]);

            AccountCharge::create([
                'account_id' => $emergency->account_id,
                'created_by' => $user->id,
                'type' => $kind,
                'description' => $item->name,
                'quantity' => $quantity,
                'unit_price' => $item->price,
                'total' => $total,
                'source_type' => EmergencyApplication::class,
                'source_id' => $application->id,
            ]);

            return $application;
        });
    }
}
