<?php

namespace App\Http\Requests;

use App\Models\Admission;
use App\Models\Emergency;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Order analyses and imaging from Consulta (the doctor of the turn) or Emergencia */
class StudyOrderRequest extends FormRequest
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

        if ($this->route('admission') instanceof Admission) {
            return $user->can('module.internamiento.access');
        }

        return $emergency instanceof Emergency && $user->can('module.emergencia.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'lab_test_ids' => ['required_without:imaging_study_ids', 'array', 'max:40'],
            'lab_test_ids.*' => ['integer', 'distinct', Rule::exists('lab_tests', 'id')->where('is_active', true)],
            'imaging_study_ids' => ['required_without:lab_test_ids', 'array', 'max:20'],
            'imaging_study_ids.*' => ['integer', 'distinct', Rule::exists('imaging_studies', 'id')->where('is_active', true)],
            'indication' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'lab_test_ids.required_without' => 'Elige al menos un análisis o estudio de imagen.',
            'imaging_study_ids.required_without' => 'Elige al menos un análisis o estudio de imagen.',
            'lab_test_ids.*.exists' => 'Ese análisis no está disponible.',
            'imaging_study_ids.*.exists' => 'Ese estudio de imagen no está disponible.',
        ];
    }

    /** @return list<int> */
    public function testIds(): array
    {
        return array_values(array_map('intval', (array) $this->validated('lab_test_ids', [])));
    }

    /** @return list<int> */
    public function studyIds(): array
    {
        return array_values(array_map('intval', (array) $this->validated('imaging_study_ids', [])));
    }
}
