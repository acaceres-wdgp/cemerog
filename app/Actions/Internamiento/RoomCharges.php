<?php

namespace App\Actions\Internamiento;

use App\Models\Admission;
use App\Models\AdmissionStay;
use Carbon\CarbonInterface;

/**
 * Days of stay × price per day (ADR-023). The admission day is day 1 and
 * the discharge day counts too. A day is charged at the price of the bed
 * the patient was in when the day began; on the admission day, the first
 * bed. So a change of room applies its price from the next day.
 */
class RoomCharges
{
    /**
     * Consecutive days at the same bed grouped into one line.
     *
     * @return list<array{bed_label: string, room_type: string, daily_price: int, days: int, total: int}>
     */
    public function lines(Admission $admission, ?CarbonInterface $until = null): array
    {
        $until = ($admission->discharged_at ?? $until ?? now())->copy();
        /** @var list<AdmissionStay> $stays */
        $stays = $admission->stays()->get()->all();
        if ($stays === []) {
            return [];
        }

        $lines = [];
        $day = $admission->admitted_at->copy()->startOfDay();
        $last = $until->copy()->startOfDay();
        $first = true;
        while ($day->lte($last)) {
            $stay = $first ? $stays[0] : $this->stayAt($stays, $day);
            $first = false;
            $key = count($lines) - 1;
            if ($key >= 0 && $lines[$key]['stay_id'] === $stay->id) {
                $lines[$key]['days']++;
            } else {
                $lines[] = ['stay_id' => $stay->id, 'bed_label' => $stay->bed_label, 'room_type' => $stay->room_type, 'daily_price' => $stay->daily_price, 'days' => 1];
            }
            $day = $day->addDay();
        }

        return array_map(fn (array $l): array => [
            'bed_label' => $l['bed_label'],
            'room_type' => $l['room_type'],
            'daily_price' => $l['daily_price'],
            'days' => $l['days'],
            'total' => $l['daily_price'] * $l['days'],
        ], $lines);
    }

    public function total(Admission $admission, ?CarbonInterface $until = null): int
    {
        return array_sum(array_column($this->lines($admission, $until), 'total'));
    }

    /** @param list<AdmissionStay> $stays */
    private function stayAt(array $stays, CarbonInterface $moment): AdmissionStay
    {
        $current = $stays[0];
        foreach ($stays as $stay) {
            if ($stay->started_at->lte($moment)) {
                $current = $stay;
            }
        }

        return $current;
    }
}
