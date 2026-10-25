<?php

use Illuminate\Support\Facades\Schema;

/**
 * Reversibility test for 2026_10_25_000000_add_user_id_and_office_to_doctors_table.
 *
 * Verifies that:
 *  - both columns exist after migration is applied (initial state for tests)
 *  - migrate:rollback removes both columns
 *  - re-running migrate restores both columns
 */
test('add_user_id_office_to_doctors migration: up → down → up sin errores', function () {
    // Estado inicial: migración ya aplicada → columnas presentes
    expect(Schema::hasColumn('doctors', 'user_id'))->toBeTrue();
    expect(Schema::hasColumn('doctors', 'office'))->toBeTrue();

    // down(): elimina user_id y office
    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_25_000000_add_user_id_and_office_to_doctors_table.php',
    ])->assertSuccessful();

    expect(Schema::hasColumn('doctors', 'user_id'))->toBeFalse();
    expect(Schema::hasColumn('doctors', 'office'))->toBeFalse();

    // up(): restaura user_id y office
    $this->artisan('migrate', [
        '--path' => 'database/migrations/2026_10_25_000000_add_user_id_and_office_to_doctors_table.php',
        '--force' => true,
    ])->assertSuccessful();

    expect(Schema::hasColumn('doctors', 'user_id'))->toBeTrue();
    expect(Schema::hasColumn('doctors', 'office'))->toBeTrue();
});
