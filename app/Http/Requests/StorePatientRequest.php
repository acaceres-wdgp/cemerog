<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.registro.access');
    }

    public function rules(): array
    {
        return [
            'document_type' => ['required', 'string', Rule::in(['cedula', 'pasaporte', 'rnc'])],
            'document_number' => ['required', 'string', 'max:30', 'unique:patients,document_number'],
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
        ];
    }
}
