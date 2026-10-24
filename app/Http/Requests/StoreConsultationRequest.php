<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'turn_id' => ['nullable', 'integer', 'exists:turns,id'],
            'peso' => ['nullable', 'integer', 'min:0'],
            'talla' => ['nullable', 'integer', 'min:0'],
            'temp' => ['nullable', 'integer', 'min:0'],
            'presion_arterial' => ['nullable', 'string', 'max:20'],
            'frecuencia_cardiaca' => ['nullable', 'integer', 'min:0'],
            'frecuencia_respiratoria' => ['nullable', 'integer', 'min:0'],
            'saturacion_o2' => ['nullable', 'integer', 'min:0', 'max:100'],
            'glucemia' => ['nullable', 'integer', 'min:0'],
            'motivo_consulta' => ['nullable', 'string'],
            'historia_enfermedad' => ['nullable', 'string'],
            'examen_fisico' => ['nullable', 'string'],
            'diagnosticos' => ['nullable', 'array'],
            'diagnosticos.*.code' => ['required_with:diagnosticos', 'string', 'max:20'],
            'diagnosticos.*.label' => ['required_with:diagnosticos', 'string', 'max:255'],
            'plan_tratamiento' => ['nullable', 'string'],
        ];
    }
}
