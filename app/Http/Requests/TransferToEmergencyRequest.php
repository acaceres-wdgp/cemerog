<?php

namespace App\Http\Requests;

use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/** «Pasar a emergencia»: only the doctor of the turn, while it is open today */
class TransferToEmergencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();
        /** @var Turn|null $turn */
        $turn = $this->route('turn');

        return $user->doctor !== null && $turn !== null
            && $turn->doctor_id === $user->doctor->id
            && $turn->isOpenToday();
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'cubicle_id' => ['required', 'integer', 'exists:emergency_cubicles,id'],
            'reason' => ['required', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'cubicle_id.required' => 'Elige un cubículo libre.',
            'reason.required' => 'Indica el motivo del traslado.',
        ];
    }
}
