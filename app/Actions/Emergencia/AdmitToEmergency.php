<?php

namespace App\Actions\Emergencia;

use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Actions\CreatePatient;
use App\Models\AccountCharge;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\Patient;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Quick admission: registers the minimum to start caring for the patient,
 * puts them in a free cubicle and charges the emergency fee at once.
 */
class AdmitToEmergency
{
    public function __construct(
        private readonly CreatePatient $createPatient,
        private readonly GetOrOpenDailyAccount $getOrOpenDailyAccount,
    ) {}

    /**
     * @param  array<string, mixed>|null  $newPatient  minimal data when the patient is not registered
     */
    public function handle(?Patient $patient, ?array $newPatient, int $cubicleId, int $doctorId, string $reason, User $user): Emergency
    {
        return DB::transaction(function () use ($patient, $newPatient, $cubicleId, $doctorId, $reason, $user): Emergency {
            $cubicle = EmergencyCubicle::whereKey($cubicleId)->lockForUpdate()->first();
            if ($cubicle === null || ! $cubicle->is_active || Emergency::where('occupied_cubicle_id', $cubicleId)->exists()) {
                throw ValidationException::withMessages(['cubicle_id' => 'Ese cubículo no está libre. Elige otro.']);
            }

            if ($patient !== null && Emergency::active()->where('patient_id', $patient->id)->exists()) {
                throw ValidationException::withMessages(['patient_id' => 'Este paciente ya está en emergencia.']);
            }

            $patient ??= $this->createPatient->handle([...($newPatient ?? []), 'profile_incomplete' => true]);
            $account = $this->getOrOpenDailyAccount->handle($patient, now());

            $emergency = Emergency::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctorId,
                'account_id' => $account->id,
                'cubicle_id' => $cubicle->id,
                'occupied_cubicle_id' => $cubicle->id,
                'reason' => trim($reason),
                'status' => 'activa',
                'arrived_at' => now(),
                'created_by' => $user->id,
            ]);
            $emergency->update(['number' => sprintf('E-%06d', $emergency->id)]);

            $fee = Setting::emergencyFee();
            AccountCharge::create([
                'account_id' => $account->id,
                'doctor_id' => $doctorId,
                'created_by' => $user->id,
                'type' => 'emergencia',
                'description' => 'Emergencia',
                'quantity' => 1,
                'unit_price' => $fee,
                'total' => $fee,
                'source_type' => Emergency::class,
                'source_id' => $emergency->id,
            ]);

            return $emergency;
        });
    }
}
