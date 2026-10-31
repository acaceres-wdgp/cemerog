<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.caja.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'discount_type' => ['nullable', Rule::in(['porcentaje', 'monto'])],
            'discount_value' => ['nullable', 'required_with:discount_type', 'integer', 'min:1'],
            'discount_reason' => ['nullable', 'required_with:discount_type', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'discount_value.required_with' => 'Indica el descuento.',
            'discount_reason.required_with' => 'Indica el motivo del descuento.',
        ];
    }
}
