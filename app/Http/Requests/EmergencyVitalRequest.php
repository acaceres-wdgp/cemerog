<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EmergencyVitalRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Also used by Internamiento (route {admission})
        return $this->user()->can($this->route('admission') !== null ? 'module.internamiento.access' : 'module.emergencia.access');
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
            'frecuencia_cardiaca.between' => 'La frecuencia cardíaca va de 20 a 250 lpm.',
            'frecuencia_respiratoria.between' => 'La frecuencia respiratoria va de 4 a 80 rpm.',
            'temp.between' => 'La temperatura va de 30 a 45 °C.',
            'saturacion_o2.between' => 'La SpO₂ va de 40 a 100 %.',
            'glucemia.between' => 'La glucemia va de 10 a 1500 mg/dL.',
        ];
    }
}
