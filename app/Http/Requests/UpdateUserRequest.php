<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:100'],
            'username' => [
                'required',
                'string',
                'max:50',
                'lowercase',
                'regex:/^[a-z0-9._]+$/',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'email' => ['nullable', 'email', 'max:191'],
            'is_active' => ['boolean'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.regex' => 'El nombre de usuario solo puede contener letras minúsculas, números, puntos y guiones bajos.',
            'username.unique' => 'Este nombre de usuario ya está en uso.',
        ];
    }
}
