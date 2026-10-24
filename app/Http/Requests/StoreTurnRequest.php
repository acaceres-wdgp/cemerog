<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTurnRequest extends FormRequest
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
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' => 'El paciente es obligatorio.',
            'patient_id.exists' => 'El paciente seleccionado no existe.',
            'doctor_id.required' => 'El médico es obligatorio.',
            'doctor_id.exists' => 'El médico seleccionado no existe.',
        ];
    }
}
