<?php

use Illuminate\Support\Facades\Schema;

/**
 * Reversibility tests for patient migrations.
 * Each test verifies the up → down → up cycle for a specific migration.
 *
 * Note: remove_soft_deletes reversibility is superseded by restore_soft_deletes
 * (ADR-012); see SoftDeletesTest for the restore migration's up→down→up test.
 */

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
