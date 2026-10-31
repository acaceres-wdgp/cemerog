<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VoidInvoiceRequest extends FormRequest
{
    /** Only an administrator voids invoices */
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrador');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'void_reason' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return ['void_reason.required' => 'Indica el motivo de la anulación.'];
    }
}
