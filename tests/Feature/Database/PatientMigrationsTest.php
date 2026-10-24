<?php

use Illuminate\Support\Facades\Schema;

/**
 * Reversibility tests for patient migrations.
 * Each test verifies the up → down → up cycle for a specific migration.
 */

// ── 2026_10_24_100000_remove_soft_deletes_from_patients ───────────────────────

test('remove_soft_deletes migration: down → up cycle correcto', function () {
    // Estado inicial: deleted_at existe (restaurada por restore_soft_deletes), is_active ausente
    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeTrue();
    expect(Schema::hasColumn('patients', 'is_active'))->toBeFalse();

    // restore_soft_deletes también gestiona deleted_at; debe revertirse primero
    // para que el down() de remove_soft_deletes pueda agregar deleted_at sin conflicto
    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_24_300000_restore_soft_deletes_to_patients.php',
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeFalse();

    // down(): restaura deleted_at e is_active
    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_24_100000_remove_soft_deletes_from_patients.php',
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeTrue();
    expect(Schema::hasColumn('patients', 'is_active'))->toBeTrue();

    // up(): vuelve a eliminar deleted_at e is_active
    $this->artisan('migrate', [
        '--path' => 'database/migrations/2026_10_24_100000_remove_soft_deletes_from_patients.php',
        '--force' => true,
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeFalse();
    expect(Schema::hasColumn('patients', 'is_active'))->toBeFalse();

    // Restaurar restore_soft_deletes para dejar el esquema como estaba al iniciar el test
    $this->artisan('migrate', [
        '--path' => 'database/migrations/2026_10_24_300000_restore_soft_deletes_to_patients.php',
        '--force' => true,
    ])->assertSuccessful();

    expect(Schema::hasColumn('patients', 'deleted_at'))->toBeTrue();
    expect(Schema::hasColumn('patients', 'is_active'))->toBeFalse();
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
