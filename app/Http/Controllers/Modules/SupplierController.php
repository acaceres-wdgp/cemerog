<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupplierRequest;
use App\Models\InventoryItem;
use App\Models\Supplier;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Inventario › Proveedores */
class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('almacen/proveedores', [
            'suppliers' => Supplier::withCount('entries')->orderBy('name')->get()
                ->map(fn (Supplier $s): array => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'rnc' => $s->rnc,
                    'phone' => $s->phone,
                    'contact' => $s->contact,
                    'is_active' => $s->is_active,
                    'entries_count' => (int) $s->getAttribute('entries_count'),
                ])->all(),
            'can_edit' => (bool) $request->user()?->hasAnyRole(InventoryItem::EDITOR_ROLES),
        ]);
    }

    public function store(SupplierRequest $request): RedirectResponse
    {
        $supplier = Supplier::create([...$this->clean($request->validated()), 'is_active' => true]);

        Toast::success("Proveedor {$supplier->name} registrado.");
        // The goods entry selects the supplier just created
        Inertia::flash('supplier', ['id' => $supplier->id, 'name' => $supplier->name]);

        return back();
    }

    public function update(SupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($this->clean($request->validated()));

        Toast::success("Proveedor {$supplier->name} actualizado.");

        return back();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function clean(array $data): array
    {
        return array_map(fn ($v) => is_string($v) ? (trim($v) === '' ? null : trim($v)) : $v, $data);
    }
}
