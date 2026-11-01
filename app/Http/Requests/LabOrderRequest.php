<?php

namespace App\Http\Requests;

use App\Models\Emergency;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Order analyses from Consulta (the doctor of the turn) or Emergencia */
class LabOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();
        $turn = $this->route('turn');
        $emergency = $this->route('emergency');

        if ($turn instanceof Turn) {
            return $user->doctor !== null && $turn->doctor_id === $user->doctor->id;
        }

        return $emergency instanceof Emergency && $user->can('module.emergencia.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'lab_test_ids' => ['required', 'array', 'min:1', 'max:40'],
            'lab_test_ids.*' => ['integer', 'distinct', Rule::exists('lab_tests', 'id')->where('is_active', true)],
            'indication' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'lab_test_ids.required' => 'Elige al menos un análisis.',
            'lab_test_ids.*.exists' => 'Ese análisis no está disponible.',
        ];
    }

    /** @return list<int> */
    public function testIds(): array
    {
        return array_values(array_map('intval', (array) $this->validated('lab_test_ids')));
    }
}
