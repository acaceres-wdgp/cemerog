<?php

namespace App\Actions;

use App\Actions\Concerns\KeepsOnlyExtraPermissions;
use App\Models\User;

class UpdateUser
{
    use KeepsOnlyExtraPermissions;

    /**
     * @param  array<string, mixed>  $data
     */
    public function handle(User $user, array $data): User
    {
        $roles = $data['roles'] ?? [];
        $permissions = $data['permissions'] ?? [];

        $user->update([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['email'] ?? null,
            'is_active' => $data['is_active'] ?? $user->is_active,
        ]);

        $user->syncRoles($roles);
        $user->syncPermissions($this->extraPermissions($roles, $permissions));

        return $user;
    }
}
