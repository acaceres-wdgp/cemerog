<?php

namespace App\Actions\Internamiento;

use App\Actions\Accounts\GetOrOpenDailyAccount;
use App\Models\Admission;
use App\Models\Bed;
use App\Models\Discharge;
use App\Models\Emergency;
use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Ingreso a internamiento from Emergencia, Consulta or directly from the
 * bed map. The account of that attention continues for the whole stay
 * (ADR-023): the emergency closes as transferred and the consulta as
 * attended, without sending the account to billing.
 */
class AdmitPatient
{
    public function __construct(private readonly GetOrOpenDailyAccount $getOrOpenDailyAccount) {}

    /**
     * @param  array{bed_id: int, doctor_id: int, diagnosis: string, treatment?: string|null}  $data
     */
    public function handle(Patient $patient, array $data, User $user, ?Emergency $emergency = null, ?Turn $turn = null): Admission
    {
        return DB::transaction(function () use ($patient, $data, $user, $emergency, $turn): Admission {
            $bed = Bed::with('room.type')->whereKey($data['bed_id'])->lockForUpdate()->first();
            if ($bed === null || $bed->status !== 'libre') {
                throw ValidationException::withMessages(['bed_id' => 'Esa cama no está libre. Elige otra.']);
            }
            if (Admission::active()->where('patient_id', $patient->id)->exists()) {
                throw ValidationException::withMessages(['patient_id' => 'Este paciente ya está internado.']);
            }

            [$code, $label] = self::parseDiagnosis($data['diagnosis']);

            if ($emergency !== null) {
                $account = $emergency->account;
                $this->closeEmergency($emergency, $user, $bed, $label);
            } else {
                $account = $this->getOrOpenDailyAccount->handle($patient, now());
                $turn?->update(['status' => 'atendido']);
            }

            $admission = Admission::create([
                'patient_id' => $patient->id,
                'account_id' => $account->id,
                'bed_id' => $bed->id,
                'doctor_id' => $data['doctor_id'],
                'origin' => $emergency !== null ? 'emergencia' : ($turn !== null ? 'consulta' : 'directo'),
                'emergency_id' => $emergency?->id,
                'turn_id' => $turn?->id,
                'diagnosis_code' => $code,
                'diagnosis_label' => $label,
                'treatment' => isset($data['treatment']) && trim((string) $data['treatment']) !== '' ? trim((string) $data['treatment']) : null,
                'status' => 'internado',
                'admitted_at' => now(),
                'created_by' => $user->id,
            ]);
            $admission->update(['number' => sprintf('IN-%06d', $admission->id)]);

            $admission->stays()->create([
                'bed_id' => $bed->id,
                'bed_label' => $bed->label(),
                'room_type' => $bed->room->type->name,
                'daily_price' => $bed->room->type->daily_price,
                'started_at' => now(),
                'created_by' => $user->id,
            ]);
            $bed->update(['status' => 'ocupada', 'cleaning_since' => null]);

            return $admission;
        });
    }

    /**
     * «J18.9 Neumonía, no especificada» → [J18.9, Neumonía…]; without a code
     * the whole text is the label.
     *
     * @return array{0: string|null, 1: string}
     */
    public static function parseDiagnosis(string $text): array
    {
        $text = trim($text);
        if (preg_match('/^([A-Z]\d{2}(?:\.\d+)?)\s+(.+)$/u', $text, $m) === 1) {
            return [$m[1], trim($m[2])];
        }

        return [null, $text];
    }

    /** The emergency ends as a transfer to internamiento, keeping its account open */
    private function closeEmergency(Emergency $emergency, User $user, Bed $bed, string $diagnosis): void
    {
        if (! $emergency->isActive()) {
            throw ValidationException::withMessages(['emergency' => 'Esta emergencia ya fue cerrada.']);
        }
        Discharge::create([
            'emergency_id' => $emergency->id,
            'patient_id' => $emergency->patient_id,
            'doctor_id' => $emergency->doctor_id,
            'type' => 'traslado',
            'destination' => 'Internamiento · '.$bed->label(),
            'discharge_diagnosis' => $diagnosis,
            'created_by' => $user->id,
        ]);
        $emergency->update(['status' => 'alta', 'discharged_at' => now(), 'occupied_cubicle_id' => null]);
    }
}
