<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAntecedentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'personales' => ['nullable', 'string'],
            'quirurgicos' => ['nullable', 'string'],
            'medicamentos' => ['nullable', 'string'],
            'familiares' => ['nullable', 'string'],
            'alergias' => ['nullable', 'string'],
        ];
    }
}
