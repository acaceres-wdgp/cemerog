<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Inventario\RegisterStockEntry;
use App\Http\Controllers\Controller;
use App\Http\Requests\StockEntryRequest;
use App\Models\InventoryItem;
use App\Models\StockEntry;
use App\Models\Supplier;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/** Inventario › Entrada de mercancía */
class EntradaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('entrada/index', [
            'items' => InventoryItem::where('is_active', true)->orderBy('name')->get()
                ->map(fn (InventoryItem $i): array => [
                    'id' => $i->id,
                    'code' => $i->code,
                    'name' => $i->name,
                    'presentation' => $i->presentation,
                    'kind' => $i->kind,
                    'stock' => $i->stock,
                    'cost' => $i->cost,
                    'price' => $i->price,
                ])->all(),
            'suppliers' => Supplier::where('is_active', true)->orderBy('name')->get(['id', 'name'])->toArray(),
            'next_number' => StockEntry::nextNumber(),
            'recent' => StockEntry::with('supplier')->withCount('lines')->latest('id')->limit(8)->get()
                ->map(fn (StockEntry $e): array => [
                    'id' => $e->id,
                    'number' => $e->number,
                    'received_on' => $e->received_on->format('d/m/Y'),
                    'supplier' => $e->supplier->name,
                    'lines_count' => (int) $e->getAttribute('lines_count'),
                    'total_cost' => $e->total_cost,
                ])->all(),
            'today' => today()->toDateString(),
        ]);
    }

    public function store(StockEntryRequest $request, RegisterStockEntry $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $entry = $action->handle(
            Supplier::findOrFail($data['supplier_id']),
            $data['invoice_ref'] ?? null,
            Carbon::parse($data['received_on']),
            array_values($data['lines']),
            $user,
        );

        Toast::success("Entrada {$entry->number} registrada · {$entry->units} unidades.");

        return redirect()->route('entrada');
    }
}
