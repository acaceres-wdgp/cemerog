<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            // «Ingreso para cirugía»: admit and schedule in one step
            'surgery' => ['nullable', 'array'],
            'surgery.surgery_procedure_id' => ['required_with:surgery', 'integer', Rule::exists('surgery_procedures', 'id')->where('is_active', true)],
            'surgery.surgeon_id' => ['required_with:surgery', 'integer', 'exists:doctors,id'],
            'surgery.anesthetist_id' => ['nullable', 'integer', 'exists:doctors,id', 'different:surgery.surgeon_id'],
            'surgery.operating_room_id' => ['required_with:surgery', 'integer', 'exists:operating_rooms,id'],
            'surgery.date' => ['required_with:surgery', 'date_format:Y-m-d'],
            'surgery.time' => ['required_with:surgery', 'date_format:H:i'],
            'surgery.duration_minutes' => ['required_with:surgery', 'integer', 'min:15', 'max:720'],
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
            'surgery.surgery_procedure_id.required_with' => 'Elige el procedimiento.',
            'surgery.surgeon_id.required_with' => 'Elige el cirujano.',
        ];
    }
}
