<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.doctores.access');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'exequatur' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:20'],
            'specialty_id' => ['nullable', 'integer', Rule::exists('specialties', 'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del doctor es obligatorio.',
            'name.max' => 'El nombre no puede superar los 100 caracteres.',
            'exequatur.max' => 'El exequátur no puede superar los 30 caracteres.',
            'phone.max' => 'El teléfono no puede superar los 20 caracteres.',
            'specialty_id.exists' => 'La especialidad seleccionada no es válida.',
        ];
    }
}
