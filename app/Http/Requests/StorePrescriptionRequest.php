<?php

namespace App\Http\Requests;

use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StorePrescriptionRequest extends FormRequest
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
            'general_instructions' => ['nullable', 'string', 'max:2000'],
            'items' => ['present', 'array'],
            'items.*.position' => ['required', 'integer', 'min:1'],
            'items.*.medication' => ['required', 'string', 'max:255'],
            'items.*.route' => ['nullable', 'string', 'max:100'],
            'items.*.dose' => ['required', 'string', 'max:100'],
            'items.*.frequency' => ['required', 'string', 'max:100'],
            'items.*.duration_days' => ['nullable', 'integer', 'min:1', 'required_if:items.*.is_continuous,false'],
            'items.*.is_continuous' => ['required', 'boolean'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
