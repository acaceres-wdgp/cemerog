<?php

use Illuminate\Support\Facades\Schema;

/**
 * Reversibility tests for patient migrations.
 * Each test verifies the up → down → up cycle for a specific migration.
 */

// ── 2026_10_24_100000_remove_soft_deletes_from_patients ───────────────────────

test('remove_soft_deletes migration: up → down → up sin errores', function () {
    // Estado inicial: migración ya aplicada (deleted_at e is_active ausentes)
    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeFalse()
        ->and(Schema::hasColumn('patients', 'is_active'))->toBeFalse();

    // down(): restaura deleted_at e is_active
    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_24_100000_remove_soft_deletes_from_patients.php',
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeTrue()
        ->and(Schema::hasColumn('patients', 'is_active'))->toBeTrue();

    // up(): vuelve a eliminar las columnas
    $this->artisan('migrate', [
        '--path' => 'database/migrations/2026_10_24_100000_remove_soft_deletes_from_patients.php',
        '--force' => true,
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeFalse()
        ->and(Schema::hasColumn('patients', 'is_active'))->toBeFalse();
});

// ── 2026_10_24_100001_add_phone_hash_to_patients ─────────────────────────────

test('add_phone_hash migration: up → down → up sin errores', function () {
    // Estado inicial: migración ya aplicada (phone_hash existe)
    expect(Schema::hasColumn('patients', 'phone_hash'))->toBeTrue();

    // down(): elimina phone_hash
    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_24_100001_add_phone_hash_to_patients.php',
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'phone_hash'))->toBeFalse();

    // up(): restaura phone_hash
    $this->artisan('migrate', [
        '--path' => 'database/migrations/2026_10_24_100001_add_phone_hash_to_patients.php',
        '--force' => true,
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'phone_hash'))->toBeTrue();
});
