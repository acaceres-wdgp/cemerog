<?php

namespace App\Http\Requests;

use App\Models\InventoryItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Create or edit a catalog item: administrators only */
class InventoryItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrador');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'presentation' => ['nullable', 'string', 'max:100'],
            'kind' => ['required', Rule::in(array_keys(InventoryItem::KINDS))],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'stock' => ['required', 'integer', 'min:-100000', 'max:1000000'],
            'min_stock' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'kind.in' => 'Elige Medicamento o Insumo.',
            'price.min' => 'El precio no puede ser negativo.',
        ];
    }
}
