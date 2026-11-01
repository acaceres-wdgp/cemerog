<?php

namespace App\Http\Requests;

use App\Models\ImagingStudy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ImagingStudyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('module.imgcat.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var ImagingStudy|null $study */
        $study = $this->route('study');

        return [
            'code' => ['required', 'string', 'max:20', Rule::unique('imaging_studies', 'code')->ignore($study?->id)],
            'name' => ['required', 'string', 'max:150'],
            'modality' => ['required', Rule::in(ImagingStudy::MODALITIES)],
            'preparation' => ['nullable', 'string', 'max:500'],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'code.unique' => 'Ya existe un estudio con ese código.',
        ];
    }
}
