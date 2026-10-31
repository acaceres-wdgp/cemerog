<?php

namespace App\Actions\Emergencia;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Models\Discharge;
use App\Models\Emergency;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Alta médica de una emergencia, como en Consulta: records the discharge,
 * frees the cubicle and sends the account to billing when nothing else of
 * that day is still open.
 */
class DischargeEmergency
{
    public function __construct(
        private readonly CloseDailyAccountIfDone $closeDailyAccount,
    ) {}

    /** @param array{type: string, destination?: string|null, reason?: string|null, discharge_diagnosis: string} $data */
    public function handle(Emergency $emergency, User $user, int $doctorId, array $data): Discharge
    {
        return DB::transaction(function () use ($emergency, $user, $doctorId, $data): Discharge {
            $emergency = Emergency::whereKey($emergency->id)->lockForUpdate()->firstOrFail();
            EnsureEmergencyActive::check($emergency);

            $discharge = Discharge::create([
                'emergency_id' => $emergency->id,
                'patient_id' => $emergency->patient_id,
                'doctor_id' => $doctorId,
                'type' => $data['type'],
                'destination' => $data['type'] === 'traslado' ? ($data['destination'] ?? null) : null,
                'reason' => $data['type'] === 'traslado' ? ($data['reason'] ?? null) : null,
                'discharge_diagnosis' => $data['discharge_diagnosis'],
                'created_by' => $user->id,
            ]);

            $emergency->update([
                'status' => 'alta',
                'discharged_at' => now(),
                'occupied_cubicle_id' => null,
            ]);

            $this->closeDailyAccount->handle($emergency->patient, $emergency->account->service_date);

            return $discharge;
        });
    }
}
