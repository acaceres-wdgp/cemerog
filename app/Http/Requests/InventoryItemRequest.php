<?php

namespace App\Http\Requests;

use App\Models\InventoryAdjustment;
use App\Models\InventoryItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Create or edit a catalog item: administrators and the warehouse role */
class InventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(InventoryItem::EDITOR_ROLES);
    }

    /**
     * The stock can be corrected while editing (`new_stock`), but only with
     * a reason: it becomes an adjustment, like goods entries and
     * applications to patients, every change of stock is recorded.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var InventoryItem|null $item */
        $item = $this->route('item');
        $changesStock = $item !== null && $this->filled('new_stock') && (int) $this->input('new_stock') !== $item->stock;

        return [
            'name' => ['required', 'string', 'max:150'],
            'presentation' => ['nullable', 'string', 'max:100'],
            'kind' => ['required', Rule::in(array_keys(InventoryItem::KINDS))],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'min_stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'is_active' => ['sometimes', 'boolean'],
            'new_stock' => ['nullable', 'integer', 'between:0,1000000'],
            'reason' => [Rule::requiredIf($changesStock), 'nullable', Rule::in(array_keys(InventoryAdjustment::REASONS))],
            'note' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'kind.in' => 'Elige Medicamento o Insumo.',
            'price.min' => 'El precio no puede ser negativo.',
            'reason.required' => 'Indica el motivo del cambio de existencia.',
        ];
    }
}
