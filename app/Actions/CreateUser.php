<?php

namespace App\Actions;

use App\Actions\Concerns\KeepsOnlyExtraPermissions;
use App\Models\User;

class CreateUser
{
    use KeepsOnlyExtraPermissions;

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data): User
    {
        $roles = $data['roles'] ?? [];
        $permissions = $data['permissions'] ?? [];

        $user = User::create([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['email'] ?? null,
            'password' => $data['password'],
            'is_active' => $data['is_active'] ?? true,
            // The admin assigns a temporary password: the user replaces it on first login
            'must_change_password' => true,
        ]);

        if (! empty($roles)) {
            $user->syncRoles($roles);
        }

        $permissions = $this->extraPermissions($roles, $permissions);

        if (! empty($permissions)) {
            $user->syncPermissions($permissions);
        }

        return $user;
    }
}
