<?php

/**
 * Tests must never touch a real database, whatever command runs them
 * (`vendor/bin/pest`, `php artisan test` or CI's `php artisan test --env=testing`).
 */
test('tests run in the testing environment on in-memory sqlite', function () {
    expect(app()->environment())->toBe('testing')
        ->and(config('database.default'))->toBe('sqlite')
        ->and(config('database.connections.sqlite.database'))->toBe(':memory:');
});

test('refreshing a database that is not in memory is refused', function () {
    config(['database.default' => 'mysql']);

    expect(fn () => $this->ensureInMemoryDatabase())
        ->toThrow(RuntimeException::class, 'in-memory');
});
