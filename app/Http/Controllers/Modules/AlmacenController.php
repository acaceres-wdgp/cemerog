<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryItemRequest;
use App\Models\InventoryItem;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Inventario › Catálogo: medications and supplies */
class AlmacenController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('almacen/index', [
            'items' => InventoryItem::orderBy('name')->get()
                ->map(fn (InventoryItem $i): array => [
                    'id' => $i->id,
                    'code' => $i->code,
                    'name' => $i->name,
                    'presentation' => $i->presentation,
                    'kind' => $i->kind,
                    'price' => $i->price,
                    'stock' => $i->stock,
                    'min_stock' => $i->min_stock,
                    'is_active' => $i->is_active,
                    'low_stock' => $i->isLowStock(),
                ])->all(),
            'can_edit' => (bool) $request->user()?->hasRole('administrador'),
        ]);
    }

    public function store(InventoryItemRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $item = InventoryItem::create([
            ...$data,
            'code' => InventoryItem::nextCode($data['kind']),
            'min_stock' => $data['min_stock'] ?? 0,
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
}
