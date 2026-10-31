<?php

namespace App\Http\Requests;

use App\Models\InventoryItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(InventoryItem::EDITOR_ROLES);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'integer', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'invoice_ref' => ['nullable', 'string', 'max:60'],
            'received_on' => ['required', 'date', 'before_or_equal:today'],
            'lines' => ['required', 'array', 'min:1', 'max:200'],
            'lines.*.inventory_item_id' => ['required_without:lines.*.new_item', 'nullable', 'integer', 'exists:inventory_items,id'],
            'lines.*.new_item' => ['required_without:lines.*.inventory_item_id', 'nullable', 'array'],
            'lines.*.new_item.name' => ['required_with:lines.*.new_item', 'string', 'max:150'],
            'lines.*.new_item.presentation' => ['nullable', 'string', 'max:100'],
            'lines.*.new_item.kind' => ['required_with:lines.*.new_item', Rule::in(array_keys(InventoryItem::KINDS))],
            'lines.*.new_item.price' => ['required_with:lines.*.new_item', 'integer', 'min:0', 'max:100000000'],
            'lines.*.new_item.min_stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'lines.*.quantity' => ['required', 'integer', 'between:1,1000000'],
            'lines.*.lot' => ['nullable', 'string', 'max:40'],
            'lines.*.expires_on' => ['nullable', 'date_format:Y-m'],
            'lines.*.unit_cost' => ['required', 'integer', 'min:0', 'max:100000000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'supplier_id.required' => 'Elige el proveedor.',
            'lines.required' => 'Agrega al menos un producto.',
            'lines.*.quantity.between' => 'La cantidad debe ser al menos 1.',
            'lines.*.unit_cost.min' => 'El costo no puede ser negativo.',
            'lines.*.expires_on.date_format' => 'Escribe el vencimiento como MM/AAAA.',
        ];
    }
}
