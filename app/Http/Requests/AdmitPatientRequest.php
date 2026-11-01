<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/** Ingreso a internamiento (from Emergencia, Consulta or the bed map) */
class AdmitPatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.internamiento.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'emergency_id' => ['nullable', 'integer', 'exists:emergencies,id'],
            'turn_id' => ['nullable', 'integer', 'exists:turns,id'],
            'bed_id' => ['required', 'integer', 'exists:beds,id'],
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'diagnosis' => ['required', 'string', 'max:255'],
            'treatment' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'Busca y elige al paciente.',
            'bed_id.required' => 'Elige una cama libre.',
            'doctor_id.required' => 'Elige el médico tratante.',
            'diagnosis.required' => 'Indica el diagnóstico de ingreso.',
        ];
    }
}
