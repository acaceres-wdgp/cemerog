<?php

namespace App\Actions;

use App\Models\Appointment;

class ReorderAppointment
{
    public function handle(Appointment $appointment, string $direction): void
    {
        $query = Appointment::where('doctor_id', $appointment->doctor_id)
            ->whereDate('appointment_date', $appointment->appointment_date)
            ->whereNotNull('turn_order')
            ->where('id', '!=', $appointment->id);

        $adjacent = match ($direction) {
            'up' => $query
                ->where('turn_order', '<', $appointment->turn_order)
                ->orderBy('turn_order', 'desc')
                ->first(),
            'down' => $query
                ->where('turn_order', '>', $appointment->turn_order)
                ->orderBy('turn_order', 'asc')
                ->first(),
            default => null,
        };

        if ($adjacent === null) {
            return;
        }

        $originalOrder = $appointment->turn_order;
        $appointment->turn_order = $adjacent->turn_order;
        $adjacent->turn_order = $originalOrder;

        $appointment->save();
        $adjacent->save();
    }
}
