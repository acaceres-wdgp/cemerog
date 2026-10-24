<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSpecialtyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.doctores.access');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('specialties', 'name')],
            'consultation_price' => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre de la especialidad es obligatorio.',
            'name.max' => 'El nombre no puede superar los 100 caracteres.',
            'name.unique' => 'Ya existe una especialidad con ese nombre.',
            'consultation_price.required' => 'El precio de consulta es obligatorio.',
            'consultation_price.integer' => 'El precio debe ser un número entero.',
            'consultation_price.min' => 'El precio no puede ser negativo.',
        ];
    }
}
