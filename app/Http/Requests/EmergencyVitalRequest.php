<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmergencyVitalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.emergencia.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'presion_arterial' => ['required', 'string', 'regex:/^\d{2,3}\/\d{2,3}$/'],
            'frecuencia_cardiaca' => ['required', 'integer', 'between:20,250'],
            'frecuencia_respiratoria' => ['required', 'integer', 'between:4,80'],
            'temp' => ['required', 'numeric', 'between:30,45'],
            'saturacion_o2' => ['required', 'integer', 'between:40,100'],
            'glucemia' => ['nullable', 'integer', 'between:10,1500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'presion_arterial.regex' => 'Escribe la presión como 120/80.',
            'saturacion_o2.between' => 'La SpO₂ va de 40 a 100 %.',
        ];
    }
}
