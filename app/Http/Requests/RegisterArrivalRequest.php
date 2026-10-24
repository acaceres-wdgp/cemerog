<?php

namespace App\Http\Requests;

use App\Rules\UniqueDocumentNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterArrivalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.registro.access');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $patientId = $this->input('patient_id');

        return [
            // ── Patient identity ──────────────────────────────────────────────
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],

            // ── Patient fields (required only when patient_id is absent) ──────
            'document_type' => ['required_without:patient_id', 'nullable', 'string', Rule::in(['cedula', 'pasaporte', 'cedula_extranjera', 'no_tiene'])],
            'document_number' => [
                'required_unless:document_type,no_tiene',
                'nullable', 'string', 'max:50',
                new UniqueDocumentNumber($patientId),
            ],
            'email' => ['nullable', 'string', 'email', 'max:150'],
            'first_names' => ['required_without:patient_id', 'nullable', 'string', 'max:100'],
            'last_names' => ['required_without:patient_id', 'nullable', 'string', 'max:100'],
            'birth_date' => ['required_without:patient_id', 'nullable', 'date', 'before:today'],
            'sex' => ['required_without:patient_id', 'nullable', 'string', Rule::in(['M', 'F'])],
            'phone' => ['required_without:patient_id', 'nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'blood_type' => ['nullable', 'string', Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])],
            'allergies' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:20480'],

            // ── Attention fields ───────────────────────────────────────────────
            'attention_type' => ['required', 'string', Rule::in(['consulta'])],
            'doctor_id' => ['required_if:attention_type,consulta', 'nullable', 'integer', 'exists:doctors,id'],
            'notes' => ['nullable', 'string'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'doctor_id.required_if' => 'El médico es obligatorio para una consulta.',
        ];
    }
}
