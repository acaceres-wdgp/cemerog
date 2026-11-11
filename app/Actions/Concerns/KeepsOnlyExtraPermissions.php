<?php

namespace App\Actions\Concerns;

use Spatie\Permission\Models\Role;

trait KeepsOnlyExtraPermissions
{
    /**
     * The form sends every checked permission, including the ones its roles
     * already give. Only the rest are stored as direct permissions: a copy
     * of a role permission would outlive later changes to that role.
     *
     * @param  array<int, string>  $roles
     * @param  array<int, string>  $permissions
     * @return array<int, string>
     */
    private function extraPermissions(array $roles, array $permissions): array
    {
        $fromRoles = Role::whereIn('name', $roles)
            ->with('permissions')
            ->get()
            ->flatMap(fn (Role $role) => $role->permissions->pluck('name'))
            ->all();

        return array_values(array_diff($permissions, $fromRoles));
    }
}
