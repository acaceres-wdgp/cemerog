<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('module.citas.access') ?? false;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:pendiente,confirmada,en_lista,atendida,no_asistio,cancelada'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'status.required' => 'El estado es obligatorio.',
            'status.in' => 'El estado seleccionado no es válido.',
        ];
    }
}
