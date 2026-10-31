<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\PaymentRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvoiceRequest extends FormRequest
{
    use PaymentRules;

    public function authorize(): bool
    {
        return $this->user()->can('module.caja.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // The discount is always a percentage of the subtotal
            'discount_type' => ['nullable', Rule::in(['porcentaje'])],
            'discount_value' => ['nullable', 'required_with:discount_type', 'integer', 'between:1,100'],
            'discount_reason' => ['nullable', 'required_with:discount_type', 'string', 'max:255'],
            ...$this->paymentRules(),
        ];
    }

    public function messages(): array
    {
        return [
            'discount_type.in' => 'El descuento solo puede ser en porcentaje.',
            'discount_value.required_with' => 'Indica el porcentaje de descuento.',
            'discount_value.between' => 'El descuento debe estar entre 1% y 100%.',
            'discount_reason.required_with' => 'Indica el motivo del descuento.',
        ];
    }
}
