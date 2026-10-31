<?php

namespace App\Http\Requests;

use App\Rules\UniqueDocumentNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdmitToEmergencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.emergencia.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $existing = $this->filled('patient_id');
        $identified = $this->boolean('identified', true);

        return [
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'identified' => ['sometimes', 'boolean'],
            'first_names' => [Rule::requiredIf(! $existing && $identified), 'nullable', 'string', 'max:100'],
            'last_names' => [Rule::requiredIf(! $existing && $identified), 'nullable', 'string', 'max:100'],
            'document_type' => [Rule::requiredIf(! $existing), 'nullable', Rule::in(['cedula', 'pasaporte', 'cedula_extranjera', 'no_tiene'])],
            'document_number' => [
                Rule::requiredIf(! $existing && $this->input('document_type') !== 'no_tiene'),
                'nullable', 'string', 'max:50',
                new UniqueDocumentNumber(type: (string) $this->input('document_type', 'cedula')),
            ],
            'sex' => [Rule::requiredIf(! $existing), 'nullable', Rule::in(['M', 'F'])],
            'cubicle_id' => ['required', 'integer', 'exists:emergency_cubicles,id'],
            'doctor_id' => ['required', 'integer', Rule::exists('doctors', 'id')->where('is_active', true)],
            'reason' => ['required', 'string', 'max:2000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'first_names.required' => 'Escribe los nombres o marca «Paciente no identificado».',
            'last_names.required' => 'Escribe los apellidos o marca «Paciente no identificado».',
            'document_number.required' => 'Escribe el documento o marca «No lo trae consigo».',
            'sex.required' => 'Indica el sexo.',
            'cubicle_id.required' => 'Elige un cubículo libre.',
            'doctor_id.required' => 'Elige el médico de turno.',
            'reason.required' => 'Escribe el motivo de llegada.',
        ];
    }

    /**
     * Minimal data of a patient not registered yet; null for an existing one.
     *
     * @return array<string, mixed>|null
     */
    public function newPatient(): ?array
    {
        if ($this->filled('patient_id')) {
            return null;
        }

        $identified = $this->boolean('identified', true);

        return [
            'first_names' => $identified ? trim((string) $this->input('first_names')) : 'N.N.',
            'last_names' => $identified ? trim((string) $this->input('last_names')) : 'Sin identificar',
            'document_type' => (string) $this->input('document_type'),
            'document_number' => $this->input('document_number'),
            'sex' => (string) $this->input('sex'),
        ];
    }
}
