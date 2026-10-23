<?php

namespace App\Http\Requests;

use App\Rules\UniqueDocumentNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.registro.access');
    }

    public function rules(): array
    {
        $patientId = $this->route('patient')?->id;

        return [
            'document_type' => ['required', 'string', Rule::in(['cedula', 'pasaporte', 'rnc', 'cedula_extranjera', 'no_tiene'])],
            'document_number' => ['required_unless:document_type,no_tiene', 'nullable', 'string', 'max:50', new UniqueDocumentNumber($patientId)],
            'email' => ['nullable', 'string', 'email', 'max:150'],
            'first_names' => ['required', 'string', 'max:100'],
            'last_names' => ['required', 'string', 'max:100'],
            'birth_date' => ['required', 'date', 'before:today'],
            'sex' => ['required', 'string', Rule::in(['M', 'F'])],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'blood_type' => ['nullable', 'string', Rule::in(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])],
            'allergies' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'remove_photo' => ['nullable', 'boolean'],
        ];
    }
}
