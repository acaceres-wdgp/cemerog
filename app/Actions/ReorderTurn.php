<?php

namespace App\Actions;

use App\Models\Turn;

class ReorderTurn
{
    public function handle(Turn $turn, string $direction): void
    {
        $query = Turn::where('doctor_id', $turn->doctor_id)
            ->whereDate('arrived_at', $turn->arrived_at->toDateString())
            ->where('id', '!=', $turn->id);

        $adjacent = match ($direction) {
            'up' => $query->where('turn_order', '<', $turn->turn_order)->orderBy('turn_order', 'desc')->first(),
            'down' => $query->where('turn_order', '>', $turn->turn_order)->orderBy('turn_order', 'asc')->first(),
            default => null,
        };

        if ($adjacent === null) {
            return;
        }

        $originalOrder = $turn->turn_order;
        $turn->turn_order = $adjacent->turn_order;
        $adjacent->turn_order = $originalOrder;

        $turn->save();
        $adjacent->save();
    }
}
