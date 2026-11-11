<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Dates and times as the clinic reads them: Dominican Republic time
 * (America/Santo_Domingo, UTC−4 all year) on a 12-hour clock, «9:05 PM».
 * The same format the topbar clock uses. Values sent to inputs or used to
 * place things on a grid stay in 24 hours: this is only for display.
 */
class ClinicTime
{
    public const TIMEZONE = 'America/Santo_Domingo';

    public static function time(?CarbonInterface $moment): ?string
    {
        return $moment?->copy()->setTimezone(self::TIMEZONE)->format('g:i A');
    }

    public static function dateTime(?CarbonInterface $moment, string $separator = ' '): ?string
    {
        return $moment?->copy()->setTimezone(self::TIMEZONE)->format('d/m/Y').$separator.self::time($moment);
    }
}
