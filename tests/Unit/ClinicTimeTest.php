<?php

use App\Support\ClinicTime;
use Carbon\CarbonImmutable;

/** Times are shown on a 12-hour clock with AM/PM, as in the topbar */
it('formats a time on a 12-hour clock', function () {
    $evening = CarbonImmutable::parse('2026-11-10 21:05', 'America/Santo_Domingo');
    $noon = CarbonImmutable::parse('2026-11-10 12:00', 'America/Santo_Domingo');
    $midnight = CarbonImmutable::parse('2026-11-10 00:30', 'America/Santo_Domingo');

    expect(ClinicTime::time($evening))->toBe('9:05 PM')
        ->and(ClinicTime::time($noon))->toBe('12:00 PM')
        ->and(ClinicTime::time($midnight))->toBe('12:30 AM')
        ->and(ClinicTime::dateTime($evening))->toBe('10/11/2026 9:05 PM')
        ->and(ClinicTime::time(null))->toBeNull();
});

it('shows a UTC moment in Dominican Republic time', function () {
    // 01:05 UTC on the 11th is 9:05 PM on the 10th in the Dominican Republic (UTC−4)
    $utc = CarbonImmutable::parse('2026-11-11 01:05', 'UTC');

    expect(ClinicTime::dateTime($utc))->toBe('10/11/2026 9:05 PM');
});

it('uses the Dominican Republic time zone for the app', function () {
    expect(config('app.timezone'))->toBe('America/Santo_Domingo');
});
