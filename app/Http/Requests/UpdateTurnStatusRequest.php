<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTurnStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.tablero.access');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['espera', 'en_consulta', 'atendido', 'no_asistio'])],
        ];
    }
}
