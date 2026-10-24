<?php

namespace App\Console\Commands;

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Console\Command;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'cemerog:sync-permissions';

    protected $description = 'Create or update roles and permissions (idempotent — safe to re-run on live DB)';

    public function handle(): int
    {
        $this->call('db:seed', ['--class' => RolesAndPermissionsSeeder::class, '--force' => true]);

        $this->info('Permissions synced successfully.');

        return self::SUCCESS;
    }
}
