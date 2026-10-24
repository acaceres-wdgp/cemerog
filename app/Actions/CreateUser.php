<?php

namespace App\Actions;

use App\Models\User;

class CreateUser
{
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
            'must_change_password' => $data['must_change_password'] ?? false,
        ]);

        if (! empty($roles)) {
            $user->syncRoles($roles);
        }

        if (! empty($permissions)) {
            $user->syncPermissions($permissions);
        }

        return $user;
    }
}
