<?php

use Illuminate\Support\Facades\Schema;

/**
 * Passkeys and 2FA came with the starter kit; CEMEROG doesn't use them.
 */
const TWO_FACTOR_COLUMNS = ['two_factor_secret', 'two_factor_recovery_codes', 'two_factor_confirmed_at'];

test('passkeys table and two factor columns are dropped', function () {
    expect(Schema::hasTable('passkeys'))->toBeFalse();

    foreach (TWO_FACTOR_COLUMNS as $column) {
        expect(Schema::hasColumn('users', $column))->toBeFalse();
    }
});

test('rolling back restores the passkeys table and two factor columns', function () {
    // Target this migration by path: later migrations make --step=1 roll back something else
    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_22_000001_drop_passkeys_and_two_factor_columns.php',
    ])->assertSuccessful();

    expect(Schema::hasTable('passkeys'))->toBeTrue()
        ->and(Schema::hasColumns('passkeys', ['user_id', 'name', 'credential_id', 'credential', 'last_used_at']))->toBeTrue()
        ->and(Schema::hasColumns('users', TWO_FACTOR_COLUMNS))->toBeTrue();

    $this->artisan('migrate')->assertSuccessful();

    expect(Schema::hasTable('passkeys'))->toBeFalse()
        ->and(Schema::hasColumn('users', 'two_factor_secret'))->toBeFalse();
});
