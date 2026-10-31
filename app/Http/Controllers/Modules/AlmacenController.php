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
use Illuminate\Validation\Rule;
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

    public function store(InventoryItemRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $item = InventoryItem::create([
            ...$data,
            'code' => InventoryItem::nextCode($data['kind']),
            'min_stock' => $data['min_stock'] ?? 0,
            // Starts empty: the goods come in through «Entrada de mercancía»
            'stock' => 0,
            'is_active' => true,
        ]);

        Toast::success("{$item->code} · {$item->name} agregado al catálogo.");

        return back();
    }

    public function update(InventoryItemRequest $request, InventoryItem $item): RedirectResponse
    {
        $data = $request->validated();
        $item->update([...$data, 'min_stock' => $data['min_stock'] ?? 0]);

        Toast::success("{$item->code} actualizado.");

        return back();
    }

    /** Set the stock after a physical count, waste or expired goods */
    public function adjust(Request $request, InventoryItem $item): RedirectResponse
    {
        abort_unless($request->user()?->hasAnyRole(InventoryItem::EDITOR_ROLES), 403);
        $data = $request->validate([
            'new_stock' => ['required', 'integer', 'between:0,1000000', Rule::notIn([$item->stock])],
            'reason' => ['required', Rule::in(array_keys(InventoryAdjustment::REASONS))],
            'note' => ['nullable', 'string', 'max:255'],
        ], ['new_stock.not_in' => 'La existencia ya es esa.']);

        DB::transaction(function () use ($item, $data, $request): void {
            $item = InventoryItem::whereKey($item->id)->lockForUpdate()->firstOrFail();
            InventoryAdjustment::create([
                'inventory_item_id' => $item->id,
                'stock_before' => $item->stock,
                'quantity' => (int) $data['new_stock'] - $item->stock,
                'reason' => $data['reason'],
                'note' => $data['note'] ?? null,
                'created_by' => $request->user()->id,
            ]);
            $item->update(['stock' => (int) $data['new_stock']]);
        });

        Toast::success("Existencia de {$item->name} ajustada a {$data['new_stock']}.");

        return back();
    }
}
