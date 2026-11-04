<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * The Catálogos de precios page was a static mock; each price lives in its
 * own module's catalog (ADR-025). Its permission is removed from existing DBs.
 */
const PRECIOS_PERMISSION_MIGRATION = 'migrations/2026_11_10_100000_remove_precios_permission.php';

/** Recreates the state of a database seeded before the removal (roles come from the test seeder). */
function seedPreciosPermission(): User
{
    Permission::firstOrCreate(['name' => 'module.precios.access', 'guard_name' => 'web']);
    Role::findByName('administrador')->givePermissionTo('module.precios.access');

    $user = User::factory()->create();
    $user->givePermissionTo(['module.precios.access', 'module.habs.access']);

    return $user;
}

test('removes the precios permission from roles and users', function () {
    $user = seedPreciosPermission();

    (include database_path(PRECIOS_PERMISSION_MIGRATION))->up();
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $rolePermissions = Role::findByName('administrador')->permissions->pluck('name');

    expect(Permission::where('name', 'module.precios.access')->exists())->toBeFalse()
        ->and($rolePermissions)->not->toContain('module.precios.access')
        ->and($rolePermissions)->toContain('module.habs.access')
        ->and($user->fresh()->getDirectPermissions()->pluck('name')->all())
        ->toBe(['module.habs.access']);
});

test('rolling back restores the permission on the administrador role', function () {
    seedPreciosPermission();
    $migration = include database_path(PRECIOS_PERMISSION_MIGRATION);
    $migration->up();

    $migration->down();
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    expect(Permission::where('name', 'module.precios.access')->exists())->toBeTrue()
        ->and(Role::findByName('administrador')->hasPermissionTo('module.precios.access'))->toBeTrue();
});

test('rolling back works when the administrador role does not exist', function () {
    Role::findByName('administrador')->delete();
    $migration = include database_path(PRECIOS_PERMISSION_MIGRATION);
    $migration->up();
    $migration->down();

    expect(Permission::where('name', 'module.precios.access')->exists())->toBeTrue();
});
