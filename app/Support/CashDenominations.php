<?php

namespace App\Support;

/**
 * Dominican peso bills and coins used to count the cash register.
 * Keys in a count are the face value in pesos; values are how many units.
 */
class CashDenominations
{
    /** @var list<int> Face values in pesos, largest first */
    public const VALUES = [2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];

    /**
     * Total of a count, in centavos.
     *
     * @param  array<int|string, int|string|null>  $counts
     */
    public static function total(array $counts): int
    {
        $total = 0;
        foreach ($counts as $value => $units) {
            $total += (int) $value * (int) $units * 100;
        }

        return $total;
    }

    /**
     * Keep only known face values with a positive number of units.
     *
     * @param  array<int|string, int|string|null>  $counts
     * @return array<string, int>
     */
    public static function normalize(array $counts): array
    {
        $clean = [];
        foreach (self::VALUES as $value) {
            $units = (int) ($counts[$value] ?? $counts[(string) $value] ?? 0);
            if ($units > 0) {
                $clean[(string) $value] = $units;
            }
        }

        return $clean;
    }
}
