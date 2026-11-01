<?php

namespace App\Actions\Cirugia;

use App\Models\Admission;
use App\Models\OperatingRoom;
use App\Models\Patient;
use App\Models\Surgery;
use App\Models\SurgeryProcedure;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Programar o reprogramar una cirugía. Two surgeries never overlap in the
 * same operating room. An admitted patient's surgery is linked to the stay;
 * otherwise it is ambulatory. Nothing is charged until it is performed.
 */
class ScheduleSurgery
{
    /**
     * @param  array{surgery_procedure_id: int, operating_room_id: int, surgeon_id: int, anesthetist_id?: int|null, notes?: string|null}  $data
     */
    public function handle(Patient $patient, array $data, CarbonInterface $startsAt, CarbonInterface $endsAt, User $user): Surgery
    {
        return DB::transaction(function () use ($patient, $data, $startsAt, $endsAt, $user): Surgery {
            $procedure = SurgeryProcedure::where('is_active', true)->findOrFail($data['surgery_procedure_id']);
            $this->ensureFree((int) $data['operating_room_id'], $startsAt, $endsAt);

            $surgery = Surgery::create([
                'patient_id' => $patient->id,
                'surgery_procedure_id' => $procedure->id,
                'procedure_name' => $procedure->name,
                'price' => $procedure->price,
                'operating_room_id' => $data['operating_room_id'],
                'surgeon_id' => $data['surgeon_id'],
                'anesthetist_id' => $data['anesthetist_id'] ?? null,
                'admission_id' => Admission::active()->where('patient_id', $patient->id)->value('id'),
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'programada',
                'notes' => isset($data['notes']) && trim((string) $data['notes']) !== '' ? trim((string) $data['notes']) : null,
                'created_by' => $user->id,
            ]);
            $surgery->update(['number' => sprintf('Q-%06d', $surgery->id)]);

            return $surgery;
        });
    }

    /** Reprogramar: new time and/or operating room while still scheduled */
    public function reschedule(Surgery $surgery, int $operatingRoomId, CarbonInterface $startsAt, CarbonInterface $endsAt): Surgery
    {
        return DB::transaction(function () use ($surgery, $operatingRoomId, $startsAt, $endsAt): Surgery {
            $surgery = Surgery::whereKey($surgery->id)->lockForUpdate()->firstOrFail();
            if ($surgery->status !== 'programada') {
                throw ValidationException::withMessages(['surgery' => 'Solo se reprograma una cirugía programada.']);
            }
            $this->ensureFree($operatingRoomId, $startsAt, $endsAt, $surgery->id);
            $surgery->update(['operating_room_id' => $operatingRoomId, 'starts_at' => $startsAt, 'ends_at' => $endsAt]);

            return $surgery;
        });
    }

    private function ensureFree(int $roomId, CarbonInterface $startsAt, CarbonInterface $endsAt, ?int $except = null): void
    {
        if ($endsAt->lte($startsAt)) {
            throw ValidationException::withMessages(['duration_minutes' => 'La hora de fin debe ser después del inicio.']);
        }
        $room = OperatingRoom::whereKey($roomId)->lockForUpdate()->first();
        if ($room === null || ! $room->is_active) {
            throw ValidationException::withMessages(['operating_room_id' => 'Ese quirófano no está disponible.']);
        }
        $clash = Surgery::where('operating_room_id', $roomId)
            ->where('status', '!=', 'cancelada')
            ->when($except !== null, fn ($q) => $q->where('id', '!=', $except))
            ->where('starts_at', '<', $endsAt)
            ->where('ends_at', '>', $startsAt)
            ->with('patient')
            ->first();
        if ($clash !== null) {
            throw ValidationException::withMessages(['starts_at' => "{$room->name} ya tiene «{$clash->procedure_name}» de {$clash->starts_at->format('H:i')} a {$clash->ends_at->format('H:i')}."]);
        }
    }
}
