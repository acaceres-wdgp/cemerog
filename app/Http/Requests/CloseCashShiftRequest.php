<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CloseCashShiftRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.cuadre.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'counted_cash' => ['required_without:denominations', 'nullable', 'integer', 'min:0', 'max:100000000'],
            'denominations' => ['nullable', 'array'],
            'denominations.*' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'counted_card' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'counted_transfer' => ['nullable', 'integer', 'min:0', 'max:100000000'],
            'close_note' => ['nullable', 'string', 'max:1000'],
            'confirmed' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'counted_cash.required_without' => 'Indica el efectivo contado.',
            'confirmed.accepted' => 'Marca «Caja cuadrada» para cerrar el turno.',
        ];
    }
}
