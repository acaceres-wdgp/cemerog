<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * The user form used to save the role permissions as direct ones too, so a
 * user kept them after the role lost them. The migration drops those copies.
 */
const DIRECT_COPIES_MIGRATION = 'migrations/2026_11_10_200000_remove_role_permissions_stored_as_direct.php';

/** A secretaria created by the old form: role copies plus one real extra. */
function userWithCopiedRolePermissions(): User
{
    $user = User::factory()->create();
    $user->assignRole('secretaria');
    $user->givePermissionTo(['module.inicio.access', 'module.registro.access', 'module.habs.access']);

    return $user;
}

test('drops the direct permissions the user already gets from a role', function () {
    $user = userWithCopiedRolePermissions();
    $before = $user->getAllPermissions()->pluck('name')->sort()->values()->all();

    (include database_path(DIRECT_COPIES_MIGRATION))->up();
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $user = $user->fresh();
    expect($user->getDirectPermissions()->pluck('name')->all())->toBe(['module.habs.access'])
        ->and($user->getAllPermissions()->pluck('name')->sort()->values()->all())->toBe($before);
});

test('keeps the direct permissions of users without a role', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.registro.access');

    (include database_path(DIRECT_COPIES_MIGRATION))->up();

    expect($user->fresh()->hasDirectPermission('module.registro.access'))->toBeTrue();
});

test('after the cleanup a permission removed from the role is lost', function () {
    $user = userWithCopiedRolePermissions();
    (include database_path(DIRECT_COPIES_MIGRATION))->up();

    Role::findByName('secretaria')->revokePermissionTo('module.registro.access');
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    expect($user->fresh()->hasPermissionTo('module.registro.access'))->toBeFalse();
});

test('rolling back leaves the effective permissions unchanged', function () {
    $user = userWithCopiedRolePermissions();
    $before = $user->getAllPermissions()->pluck('name')->sort()->values()->all();
    $migration = include database_path(DIRECT_COPIES_MIGRATION);
    $migration->up();

    $migration->down();
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    expect($user->fresh()->getAllPermissions()->pluck('name')->sort()->values()->all())->toBe($before);
});
