<?php

namespace App\Support;

/** Amounts are always integer centavos; this only formats them for messages. */
class Money
{
    public static function format(int $centavos): string
    {
        $sign = $centavos < 0 ? '-' : '';

        return $sign.'RD$'.number_format(abs($centavos) / 100, 2, '.', ',');
    }
}
