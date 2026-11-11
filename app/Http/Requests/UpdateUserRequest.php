<?php

namespace App\Http\Requests;

use App\Http\Controllers\Modules\AdminController;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Spatie\Permission\Models\Role;

class UpdateUserRequest extends FormRequest
{
    private const ADMIN_PERMISSION = 'module.admin.access';

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
            'is_active' => [
                'boolean',
                // The same rule as the toggle button: no one deactivates their own account
                function (string $attribute, mixed $value, \Closure $fail) use ($userId): void {
                    if ($userId === $this->user()?->id && ! filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                        $fail(AdminController::SELF_DEACTIVATION_MESSAGE);
                    }
                },
            ],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', 'exists:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }

    /**
     * Editing your own account cannot take away your access to Administración:
     * you would be locked out, and nobody else might be able to manage users.
     *
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->route('user')?->id !== $this->user()?->id) {
                    return;
                }

                $permissions = (array) $this->input('permissions', []);
                $keepsAccess = in_array(self::ADMIN_PERMISSION, $permissions, true)
                    || Role::whereIn('name', (array) $this->input('roles', []))
                        ->whereHas('permissions', fn ($query) => $query->where('name', self::ADMIN_PERMISSION))
                        ->exists();

                if (! $keepsAccess) {
                    $validator->errors()->add(
                        'permissions',
                        'No puedes quitarte el acceso a Administración. Pide a otro administrador que lo haga.',
                    );
                }
            },
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
