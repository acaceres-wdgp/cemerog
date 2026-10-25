<?php

namespace App\Actions\Registro;

use App\Actions\AssignTurn;
use App\Actions\CreatePatient;
use App\Actions\UpdatePatient;
use App\Exceptions\PatientHasOpenTurnException;
use App\Models\Patient;
use App\Models\Turn;
use Illuminate\Support\Facades\DB;

/**
 * Unified arrival registration: create (or update) the patient and open a turn,
 * all in a single database transaction.
 *
 * @param  Patient|null  $patient  Existing patient to update, or null to create a new one.
 * @param  array<string, mixed>  $patientData  Fields to store/update on the patient record.
 *                                             Pass an empty array when the patient exists and
 *                                             no data changes are needed.
 * @param  array{doctor_id: int, appointment_id?: int|null, notes?: string|null}  $attention
 */
class RegisterArrival
{
    public function __construct(
        private readonly CreatePatient $createPatient,
        private readonly UpdatePatient $updatePatient,
        private readonly AssignTurn $assignTurn,
    ) {}

    /**
     * @param  array<string, mixed>  $patientData
     * @param  array{doctor_id: int, appointment_id?: int|null, notes?: string|null}  $attention
     */
    public function handle(?Patient $patient, array $patientData, array $attention): Turn
    {
        return DB::transaction(function () use ($patient, $patientData, $attention) {
            // Create or update the patient record
            if ($patient === null) {
                $patient = $this->createPatient->handle($patientData);
            } elseif ($patientData !== []) {
                $this->updatePatient->handle($patient, $patientData);
                $patient->refresh();
            }

            // Refuse if the patient already has an open turn today with the same doctor
            $openTurn = Turn::where('patient_id', $patient->id)
                ->where('doctor_id', $attention['doctor_id'])
                ->whereDate('arrived_at', today())
                ->whereIn('status', ['espera', 'en_consulta'])
                ->with('doctor')
                ->first();

            if ($openTurn !== null) {
                throw new PatientHasOpenTurnException($patient, $openTurn);
            }

            return $this->assignTurn->handle([
                'patient_id' => $patient->id,
                'doctor_id' => $attention['doctor_id'],
                'appointment_id' => $attention['appointment_id'] ?? null,
                'notes' => $attention['notes'] ?? null,
            ]);
        });
    }
}
