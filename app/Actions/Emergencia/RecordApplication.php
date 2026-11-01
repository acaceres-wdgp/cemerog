<?php

namespace App\Actions\Emergencia;

use App\Models\AccountCharge;
use App\Models\EmergencyApplication;
use App\Models\InventoryItem;
use App\Models\User;

/**
 * A medication or supply applied to a patient (Emergencia or
 * Internamiento). From the catalog it discounts stock (never blocking) and
 * is charged to the account; one brought by the patient is only recorded.
 * The caller runs it inside its transaction.
 */
class RecordApplication
{
    /** @param array{emergency_id?: int, admission_id?: int} $owner */
    public function handle(array $owner, int $accountId, User $user, string $kind, ?int $itemId, ?string $description, int $quantity, ?string $route): EmergencyApplication
    {
        if ($itemId === null) {
            return EmergencyApplication::create([
                ...$owner,
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
            ...$owner,
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
            'account_id' => $accountId,
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
    }
}
