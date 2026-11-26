<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryItemRequest;
use App\Models\InventoryAdjustment;
use App\Models\InventoryItem;
use App\Models\Supplier;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** Inventario › Catálogo: medications and supplies */
class AlmacenController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('almacen/index', [
            'items' => InventoryItem::with('suppliers')->orderBy('name')->get()
                ->map(fn (InventoryItem $i): array => [
                    'id' => $i->id,
                    'code' => $i->code,
                    'name' => $i->name,
                    'presentation' => $i->presentation,
                    'kind' => $i->kind,
                    'price' => $i->price,
                    'cost' => $i->cost,
                    'stock' => $i->stock,
                    'min_stock' => $i->min_stock,
                    'is_active' => $i->is_active,
                    'low_stock' => $i->isLowStock(),
                    'lot' => $i->lot,
                    'expires_on' => $i->expires_on?->format('m/Y'),
                    'expires_soon' => $i->expiresSoon(),
                    'suppliers' => $i->suppliers->sortBy('name')->map(fn (Supplier $s): array => [
                        'name' => $s->name,
                        'last_cost' => (int) $s->getRelationValue('pivot')->last_cost,
                        'last_entry_on' => Carbon::parse($s->getRelationValue('pivot')->last_entry_on)->format('d/m/Y'),
                    ])->values()->all(),
                ])->all(),
            'can_edit' => (bool) $request->user()?->hasAnyRole(InventoryItem::EDITOR_ROLES),
            'adjustment_reasons' => InventoryAdjustment::REASONS,
        ]);
    }

    /** Edit the item and, with a reason, correct its stock in the same step */
    public function update(InventoryItemRequest $request, InventoryItem $item): RedirectResponse
    {
        $data = $request->validated();
        $newStock = isset($data['new_stock']) ? (int) $data['new_stock'] : null;

        $adjusted = DB::transaction(function () use ($item, $data, $newStock, $request): bool {
            $item = InventoryItem::whereKey($item->id)->lockForUpdate()->firstOrFail();
            $item->update([
                ...collect($data)->only(['name', 'presentation', 'kind', 'price', 'is_active'])->all(),
                'min_stock' => $data['min_stock'] ?? 0,
            ]);
            if ($newStock === null || $newStock === $item->stock) {
                return false;
            }
            InventoryAdjustment::create([
                'inventory_item_id' => $item->id,
                'stock_before' => $item->stock,
                'quantity' => $newStock - $item->stock,
                'reason' => $data['reason'],
                'note' => $data['note'] ?? null,
                'created_by' => $request->user()->id,
            ]);
            $item->update(['stock' => $newStock]);

            return true;
        });

        Toast::success($adjusted ? "{$item->code} actualizado · existencia ajustada a {$newStock}." : "{$item->code} actualizado.");

        return back();
    }
}
