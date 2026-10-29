<?php

namespace App\Http\Requests;

use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreDischargeRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();

        if ($user->doctor === null) {
            return false;
        }

        /** @var Turn|null $turn */
        $turn = $this->route('turn');

        if ($turn === null) {
            return false;
        }

        return $turn->doctor_id === $user->doctor->id;
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
