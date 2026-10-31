<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/** Only a doctor gives the discharge, as in Consulta */
class DischargeEmergencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();

        return $user->can('module.emergencia.access') && $user->doctor !== null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:recuperado,traslado,defuncion'],
            'destination' => ['required_if:type,traslado', 'nullable', 'string', 'max:255'],
            'reason' => ['nullable', 'string', 'max:255'],
            'discharge_diagnosis' => ['required', 'string'],
        ];
    }
}
