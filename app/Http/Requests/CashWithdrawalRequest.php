<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CashWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.caja.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.min' => 'El monto debe ser mayor que cero.',
            'reason.required' => 'Indica el motivo del retiro.',
        ];
    }
}
