<?php

namespace App\Actions;

use App\Models\Turn;

class AssignTurn
{
    /**
     * Assign the next available turn number for the doctor today.
     *
     * @param array{
     *   patient_id: int,
     *   doctor_id: int,
     *   appointment_id?: int|null,
     *   notes?: string|null,
     * } $data
     */
    public function handle(array $data): Turn
    {
        $maxTurn = Turn::where('doctor_id', $data['doctor_id'])
            ->whereDate('arrived_at', today())
            ->max('turn_number') ?? 0;

        $turnNumber = $maxTurn + 1;

        return Turn::create([
            'patient_id' => $data['patient_id'],
            'doctor_id' => $data['doctor_id'],
            'appointment_id' => $data['appointment_id'] ?? null,
            'turn_number' => $turnNumber,
            'turn_order' => $turnNumber * 10,
            'status' => 'espera',
            'arrived_at' => now(),
            'notes' => $data['notes'] ?? null,
        ]);
    }
}
