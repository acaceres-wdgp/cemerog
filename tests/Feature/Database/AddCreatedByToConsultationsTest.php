<?php

use Illuminate\Support\Facades\Schema;

test('consultations table has created_by column after migration', function () {
    expect(Schema::hasColumn('consultations', 'created_by'))->toBeTrue();
});

test('migration add_created_by_to_consultations is reversible', function () {
    $migration = '2026_10_29_004203_add_created_by_to_consultations_table';

    // Run down specifically for this migration
    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasColumn('consultations', 'created_by'))->toBeFalse();

    // Run up again to restore for subsequent tests
    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasColumn('consultations', 'created_by'))->toBeTrue();
});
