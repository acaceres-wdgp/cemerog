<?php

namespace App\Http\Requests;

use App\Models\InventoryItem;
use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(InventoryItem::EDITOR_ROLES);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var Supplier|null $supplier */
        $supplier = $this->route('supplier');

        return [
            'name' => ['required', 'string', 'max:150', Rule::unique('suppliers', 'name')->ignore($supplier?->id)],
            'rnc' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:30'],
            'contact' => ['nullable', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['name.unique' => 'Ya existe un proveedor con ese nombre.'];
    }
}
