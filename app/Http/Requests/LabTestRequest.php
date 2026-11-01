<?php

namespace App\Http\Requests;

use App\Models\LabTest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LabTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.analisis.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var LabTest|null $test */
        $test = $this->route('test');

        return [
            'code' => ['required', 'string', 'max:20', Rule::unique('lab_tests', 'code')->ignore($test?->id)],
            'name' => ['required', 'string', 'max:150'],
            'category' => ['required', Rule::in(LabTest::CATEGORIES)],
            'preparation' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'is_active' => ['sometimes', 'boolean'],
            'parameters' => ['required', 'array', 'min:1', 'max:60'],
            'parameters.*.name' => ['required', 'string', 'max:150'],
            'parameters.*.result_type' => ['required', Rule::in(['numerico', 'texto'])],
            'parameters.*.unit' => ['nullable', 'string', 'max:30'],
            'parameters.*.min' => ['nullable', 'numeric'],
            'parameters.*.max' => ['nullable', 'numeric', 'gte:parameters.*.min'],
            'parameters.*.normal_text' => ['nullable', 'string', 'max:60'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'code.unique' => 'Ya existe un análisis con ese código.',
            'parameters.required' => 'Agrega al menos un parámetro.',
            'parameters.*.name.required' => 'Cada parámetro necesita un nombre.',
            'parameters.*.max.gte' => 'El máximo no puede ser menor que el mínimo.',
        ];
    }
}
