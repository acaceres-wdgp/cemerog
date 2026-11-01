<?php

namespace App\Actions\Lab;

use App\Actions\CreatePatient;
use App\Actions\UpdatePatient;
use App\Models\LabOrder;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * A patient who comes only for analyses: create (or update) the patient and
 * open a lab order without consulta. As with every order, nothing is charged
 * until the sample is taken (ADR-021).
 */
class RegisterLabWalkIn
{
    public function __construct(
        private readonly CreatePatient $createPatient,
        private readonly UpdatePatient $updatePatient,
        private readonly CreateLabOrder $createLabOrder,
    ) {}

    /**
     * @param  array<string, mixed>  $patientData
     * @param  list<int>  $testIds
     */
    public function handle(?Patient $patient, array $patientData, array $testIds, ?string $externalDoctor, User $user): LabOrder
    {
        return DB::transaction(function () use ($patient, $patientData, $testIds, $externalDoctor, $user): LabOrder {
            if ($patient === null) {
                $patient = $this->createPatient->handle($patientData);
            } elseif ($patientData !== []) {
                $this->updatePatient->handle($patient, $patientData);
                $patient->refresh();
            }

            $doctor = $externalDoctor !== null && trim($externalDoctor) !== '' ? trim($externalDoctor) : null;

            return $this->createLabOrder->handle($patient, 'externo', ['external_doctor' => $doctor], $testIds, null, $user);
        });
    }
}
