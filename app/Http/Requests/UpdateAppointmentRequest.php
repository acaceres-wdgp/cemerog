<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('module.citas.access') ?? false;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['nullable', 'date_format:H:i'],
            'type' => ['nullable', 'in:consulta,seguimiento,primera_vez'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'patient_id.exists' => 'El paciente seleccionado no existe.',
            'doctor_id.exists' => 'El médico seleccionado no existe.',
            'appointment_date.required' => 'La fecha de la cita es obligatoria.',
            'appointment_date.date' => 'La fecha de la cita no es válida.',
            'appointment_time.date_format' => 'La hora debe tener el formato HH:MM.',
            'type.in' => 'El tipo de cita seleccionado no es válido.',
            'notes.max' => 'Las notas no pueden superar los 500 caracteres.',
        ];
    }
}
