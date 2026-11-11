<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

/**
 * The user form saved the role permissions as direct ones too, so a user kept
 * them after the role lost them. Drops each direct permission the user already
 * gets from one of their roles; the effective permissions do not change.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('model_has_permissions')
            ->whereExists(function (Builder $query) {
                $query->select(DB::raw(1))
                    ->from('model_has_roles')
                    ->join('role_has_permissions', 'role_has_permissions.role_id', '=', 'model_has_roles.role_id')
                    ->whereColumn('model_has_roles.model_type', 'model_has_permissions.model_type')
                    ->whereColumn('model_has_roles.model_id', 'model_has_permissions.model_id')
                    ->whereColumn('role_has_permissions.permission_id', 'model_has_permissions.permission_id');
            })
            ->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Nothing to restore: the removed rows were duplicates of role permissions,
     * so the users keep the same effective permissions.
     */
    public function down(): void
    {
        //
    }
};
