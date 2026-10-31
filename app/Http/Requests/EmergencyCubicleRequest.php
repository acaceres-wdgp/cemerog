<?php

namespace App\Http\Requests;

use App\Models\EmergencyCubicle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmergencyCubicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasRole('administrador');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        /** @var EmergencyCubicle|null $cubicle */
        $cubicle = $this->route('cubicle');

        return [
            'name' => ['required', 'string', 'max:50', Rule::unique('emergency_cubicles', 'name')->ignore($cubicle?->id)],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['name.unique' => 'Ya existe un cubículo con ese nombre.'];
    }
}
