<?php

namespace App\Actions\Registro;

use App\Actions\CreatePatient;
use App\Actions\Emergencia\AdmitToEmergency;
use App\Actions\UpdatePatient;
use App\Models\Emergency;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Registro → «Emergencia»: the patient is registered with the full form
 * and admitted to emergency (cubicle, doctor, fee) in one transaction.
 * No turn is assigned.
 */
class RegisterEmergencyArrival
{
    public function __construct(
        private readonly CreatePatient $createPatient,
        private readonly UpdatePatient $updatePatient,
        private readonly AdmitToEmergency $admit,
    ) {}

    /** @param array<string, mixed> $patientData */
    public function handle(?Patient $patient, array $patientData, int $cubicleId, int $doctorId, string $reason, User $user): Emergency
    {
        return DB::transaction(function () use ($patient, $patientData, $cubicleId, $doctorId, $reason, $user): Emergency {
            if ($patient === null) {
                $patient = $this->createPatient->handle($patientData);
            } elseif ($patientData !== []) {
                $this->updatePatient->handle($patient, $patientData);
                $patient->refresh();
            }

            return $this->admit->handle($patient, null, $cubicleId, $doctorId, $reason, $user);
        });
    }
}
