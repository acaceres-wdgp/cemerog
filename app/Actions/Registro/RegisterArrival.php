<?php

namespace App\Actions\Registro;

use App\Actions\Accounts\AddConsultationCharge;
use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Actions\AssignTurn;
use App\Actions\CreatePatient;
use App\Actions\UpdatePatient;
use App\Exceptions\PatientHasOpenTurnException;
use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
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
        private readonly GetOrOpenDailyAccount $getOrOpenDailyAccount,
        private readonly AddConsultationCharge $addConsultationCharge,
    ) {}

    /**
     * @param  array<string, mixed>  $patientData
     * @param  array{doctor_id: int, appointment_id?: int|null, notes?: string|null}  $attention
     */
    public function handle(?Patient $patient, array $patientData, array $attention): Turn
    {
        /** @var User $registrar */
        $registrar = Auth::user();

        return DB::transaction(function () use ($patient, $patientData, $attention, $registrar) {
            // Create or update the patient record
            if ($patient === null) {
                $patient = $this->createPatient->handle($patientData);
            } else {
                // Lock the patient row to serialise concurrent arrivals in MySQL.
                // This prevents two requests from creating two open accounts or
                // two turns with the same doctor on the same day.
                // (SQLite is a single writer, so this has no effect in tests.)
                $patient = Patient::whereKey($patient->id)->lockForUpdate()->firstOrFail();

                if ($patientData !== []) {
                    $this->updatePatient->handle($patient, $patientData);
                    $patient->refresh();
                }
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

            $turn = $this->assignTurn->handle([
                'patient_id' => $patient->id,
                'doctor_id' => $attention['doctor_id'],
                'appointment_id' => $attention['appointment_id'] ?? null,
                'notes' => $attention['notes'] ?? null,
            ]);

            // Get or create the daily account, then add the consultation charge
            $account = $this->getOrOpenDailyAccount->handle($patient, today());
            $this->addConsultationCharge->handle($account, $turn, $registrar);

            return $turn;
        });
    }
}
