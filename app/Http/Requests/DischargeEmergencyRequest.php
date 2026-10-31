<?php

namespace App\Http\Requests;

use App\Models\Emergency;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/** An active doctor (as in Consulta) or an administrator gives the discharge */
class DischargeEmergencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();

        return Emergency::canBeDischargedBy($user);
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
