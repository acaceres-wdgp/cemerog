<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmergencyApplicationRequest extends FormRequest
{
    public const ROUTES = ['IV', 'IM', 'VO', 'SC', 'Tópica', 'Inhalada', 'Rectal', 'Sublingual'];

    public function authorize(): bool
    {
        // Also used by Internamiento (route {admission})
        return $this->user()->can($this->route('admission') !== null ? 'module.internamiento.access' : 'module.emergencia.access');
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $kind = (string) $this->input('kind');
        $brought = $kind === 'medicamento' && $this->boolean('brought_by_patient');

        return [
            'kind' => ['required', Rule::in(['medicamento', 'insumo'])],
            'brought_by_patient' => ['sometimes', 'boolean'],
            'inventory_item_id' => [
                Rule::requiredIf(! $brought), 'nullable', 'integer',
                Rule::exists('inventory_items', 'id')->where('kind', $kind)->where('is_active', true),
            ],
            'description' => [Rule::requiredIf($brought), 'nullable', 'string', 'max:150'],
            'quantity' => ['required', 'integer', 'between:1,1000'],
            'route' => ['nullable', Rule::in(self::ROUTES)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'inventory_item_id.required' => 'Elige el artículo del almacén.',
            'inventory_item_id.exists' => 'Ese artículo no está disponible en el catálogo.',
            'description.required' => 'Escribe el medicamento que trajo el paciente.',
            'quantity.between' => 'La cantidad debe ser al menos 1.',
        ];
    }
}
