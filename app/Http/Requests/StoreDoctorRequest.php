<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDoctorRequest extends FormRequest
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
        $accessMode = $this->input('access_mode', 'none');
        $userId = $this->input('user_id');

        // Apply user_id validation when explicitly linking OR when user_id is provided directly
        $applyUserValidation = $accessMode === 'link_user' || ($accessMode === 'none' && $userId !== null);

        return [
            'name' => ['required', 'string', 'max:100'],
            'exequatur' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:20'],
            'specialty_id' => ['required', 'integer', Rule::exists('specialties', 'id')],
            'access_mode' => ['nullable', 'string', Rule::in(['none', 'create_user', 'link_user'])],
            'user_id' => array_merge(
                ['nullable', 'integer', Rule::exists('users', 'id')],
                $applyUserValidation ? [
                    Rule::unique('doctors', 'user_id'),
                    function (string $attribute, mixed $value, \Closure $fail): void {
                        if ($value !== null) {
                            $linkedUser = User::find($value);
                            if (! $linkedUser) {
                                $fail('El usuario seleccionado no existe.');

                                return;
                            }
                            if (! $linkedUser->is_active) {
                                $fail('El usuario seleccionado está inactivo.');

                                return;
                            }
                            // When using the old direct linking path, require medico role
                            $accessMode = $this->input('access_mode', 'none');
                            if ($accessMode === 'none' && ! $linkedUser->hasRole('medico')) {
                                $fail('El usuario seleccionado debe tener el rol de médico.');
                            }
                        }
                    },
                ] : [],
            ),
            'office' => ['nullable', 'string', 'max:100'],
            'consultation_price' => ['nullable', 'integer', 'min:0'],
            'consultation_fee' => [
                'nullable',
                'integer',
                'min:0',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $price = (int) $this->input('consultation_price', 0);
                    if ((int) $value > $price) {
                        $fail('El honorario no puede ser mayor que el precio de consulta.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre del doctor es obligatorio.',
            'name.max' => 'El nombre no puede superar los 100 caracteres.',
            'exequatur.max' => 'El exequátur no puede superar los 30 caracteres.',
            'phone.max' => 'El teléfono no puede superar los 20 caracteres.',
            'specialty_id.required' => 'Debe seleccionar una especialidad.',
            'specialty_id.exists' => 'La especialidad seleccionada no es válida.',
            'user_id.exists' => 'El usuario seleccionado no existe.',
            'user_id.unique' => 'Este usuario ya está vinculado a otro doctor.',
            'office.max' => 'El consultorio no puede superar los 100 caracteres.',
            'consultation_price.integer' => 'El precio debe ser un número entero en centavos.',
            'consultation_fee.integer' => 'El honorario debe ser un número entero en centavos.',
        ];
    }
}
