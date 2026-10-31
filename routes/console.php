<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Turns from previous days that were never called become «No asistió»,
// so their consultation charge is removed and their daily account closes.
Schedule::command('cemerog:close-stale-turns')->dailyAt('00:05');
