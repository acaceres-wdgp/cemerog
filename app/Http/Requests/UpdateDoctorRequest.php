<?php

namespace App\Http\Requests;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDoctorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.doctores.access');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Doctor $doctor */
        $doctor = $this->route('doctor');

        return [
            'name' => ['required', 'string', 'max:100'],
            'exequatur' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:20'],
            'specialty_id' => ['nullable', 'integer', Rule::exists('specialties', 'id')],
            'user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id'),
                Rule::unique('doctors', 'user_id')->ignore($doctor->id),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value !== null) {
                        $linkedUser = User::find($value);
                        if (! $linkedUser || ! $linkedUser->hasRole('medico')) {
                            $fail('El usuario seleccionado debe tener el rol de médico.');
                        }
                    }
                },
            ],
            'office' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del doctor es obligatorio.',
            'name.max' => 'El nombre no puede superar los 100 caracteres.',
            'exequatur.max' => 'El exequátur no puede superar los 30 caracteres.',
            'phone.max' => 'El teléfono no puede superar los 20 caracteres.',
            'specialty_id.exists' => 'La especialidad seleccionada no es válida.',
            'user_id.exists' => 'El usuario seleccionado no existe.',
            'user_id.unique' => 'Este usuario ya está vinculado a otro doctor.',
            'office.max' => 'El consultorio no puede superar los 100 caracteres.',
        ];
    }
}
