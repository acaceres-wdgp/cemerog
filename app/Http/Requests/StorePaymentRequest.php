<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.caja.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'payments' => ['present', 'array', 'max:3'],
            'payments.*.method' => ['required', Rule::in(Payment::METHODS)],
            'payments.*.amount' => ['required', 'integer', 'min:0'],
            'payments.*.cash_received' => ['nullable', 'integer', 'min:0'],
            'payments.*.reference' => ['nullable', 'string', 'max:100'],
            'credit' => ['nullable', 'array'],
            'credit.due_date' => ['nullable', 'date'],
            'credit.note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
