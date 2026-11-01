<?php

namespace App\Actions;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * A patient who comes only for analyses or imaging: create (or update) the
 * patient and order the studies without consulta. As with every order,
 * nothing is charged until the study is done (ADR-018, ADR-021).
 */
class RegisterStudiesWalkIn
{
    public function __construct(
        private readonly CreatePatient $createPatient,
        private readonly UpdatePatient $updatePatient,
        private readonly OrderStudies $orderStudies,
    ) {}

    /**
     * @param  array<string, mixed>  $patientData
     * @param  list<int>  $labTestIds
     * @param  list<int>  $imagingStudyIds
     * @return array{patient: Patient, numbers: list<string>}
     */
    public function handle(?Patient $patient, array $patientData, array $labTestIds, array $imagingStudyIds, ?string $externalDoctor, User $user): array
    {
        return DB::transaction(function () use ($patient, $patientData, $labTestIds, $imagingStudyIds, $externalDoctor, $user): array {
            if ($patient === null) {
                $patient = $this->createPatient->handle($patientData);
            } elseif ($patientData !== []) {
                $this->updatePatient->handle($patient, $patientData);
                $patient->refresh();
            }

            $doctor = $externalDoctor !== null && trim($externalDoctor) !== '' ? trim($externalDoctor) : null;
            $numbers = $this->orderStudies->handle(
                $patient, 'externo', ['external_doctor' => $doctor], $labTestIds, $imagingStudyIds, null, $user,
            );

            return ['patient' => $patient, 'numbers' => $numbers];
        });
    }
}
