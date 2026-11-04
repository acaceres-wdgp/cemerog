<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * The Catálogos de precios page was a static mock and has been removed (ADR-025).
 * Deleting the permission cascades to role_has_permissions and model_has_permissions.
 */
return new class extends Migration
{
    private const PERMISSION = 'module.precios.access';

    public function up(): void
    {
        Permission::where('name', self::PERMISSION)->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * Restores the permission on the administrador role, as the seeder had it.
     * Direct grants to individual users are not restored.
     */
    public function down(): void
    {
        $permission = Permission::firstOrCreate(['name' => self::PERMISSION, 'guard_name' => 'web']);

        Role::where('name', 'administrador')->where('guard_name', 'web')->first()?->givePermissionTo($permission);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
