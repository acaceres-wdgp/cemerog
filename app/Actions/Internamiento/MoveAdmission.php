<?php

namespace App\Actions\Internamiento;

use App\Models\Admission;
use App\Models\Bed;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Cambiar habitación / traslado: the patient moves to a free bed, the
 * previous one stays «En limpieza». The new price per day applies from the
 * next day (ADR-023).
 */
class MoveAdmission
{
    public function handle(Admission $admission, int $bedId, ?string $reason, User $user): Admission
    {
        return DB::transaction(function () use ($admission, $bedId, $reason, $user): Admission {
            $admission = Admission::whereKey($admission->id)->lockForUpdate()->firstOrFail();
            if (! $admission->isActive()) {
                throw ValidationException::withMessages(['admission' => 'El paciente ya fue dado de alta.']);
            }
            $target = Bed::with('room.type')->whereKey($bedId)->lockForUpdate()->first();
            if ($target === null || $target->status !== 'libre') {
                throw ValidationException::withMessages(['bed_id' => 'Esa cama no está libre. Elige otra.']);
            }

            $admission->currentStay()->first()?->update(['ended_at' => now()]);
            $admission->bed?->update(['status' => 'limpieza', 'cleaning_since' => now()]);

            $admission->stays()->create([
                'bed_id' => $target->id,
                'bed_label' => $target->label(),
                'room_type' => $target->room->type->name,
                'daily_price' => $target->room->type->daily_price,
                'started_at' => now(),
                'reason' => $reason !== null && trim($reason) !== '' ? trim($reason) : null,
                'created_by' => $user->id,
            ]);
            $target->update(['status' => 'ocupada', 'cleaning_since' => null]);
            $admission->update(['bed_id' => $target->id]);

            return $admission;
        });
    }
}
