<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

// ─── Rollback tests for prescription migrations ───────────────────────────────

test('prescriptions migration can be rolled back', function () {
    $migration = '2026_10_30_000001_create_prescriptions_table';

    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('prescriptions'))->toBeFalse();

    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('prescriptions'))->toBeTrue();
});

test('prescription_items migration can be rolled back', function () {
    $migration = '2026_10_30_000002_create_prescription_items_table';

    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('prescription_items'))->toBeFalse();

    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('prescription_items'))->toBeTrue();
});
