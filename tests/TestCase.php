<?php

namespace Tests;

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTruncation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * Seed roles and permissions after each database refresh, so module
     * permissions exist exactly as in production.
     */
    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;

    protected function setUp(): void
    {
        parent::setUp();

        // Render Inertia pages without a Vite build or a running dev server
        $this->withoutVite();
    }

    /**
     * Check the database before any trait migrates, refreshes or truncates it.
     */
    protected function setUpTraits()
    {
        $uses = class_uses_recursive(static::class);

        if (array_intersect([RefreshDatabase::class, DatabaseMigrations::class, DatabaseTruncation::class], $uses)) {
            $this->ensureInMemoryDatabase();
        }

        return parent::setUpTraits();
    }

    /**
     * Refuse to touch any database that is not in memory, so a misconfigured
     * environment can never run migrate:fresh on a real database.
     */
    protected function ensureInMemoryDatabase(): void
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        if (($config['driver'] ?? null) !== 'sqlite' || ($config['database'] ?? null) !== ':memory:') {
            throw new RuntimeException(
                "Tests must use an in-memory SQLite database; refusing to touch [{$connection}]."
            );
        }
    }
}
