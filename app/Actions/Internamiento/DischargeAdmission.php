<?php

namespace App\Actions\Internamiento;

use App\Actions\Accounts\CloseDailyAccountIfDone;
use App\Models\AccountCharge;
use App\Models\Admission;
use App\Models\Discharge;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Alta de internamiento: charges the room (days × price per day), records
 * the discharge, leaves the bed «En limpieza» and sends the account of the
 * stay to billing (ADR-023).
 */
class DischargeAdmission
{
    public function __construct(
        private readonly RoomCharges $roomCharges,
        private readonly CloseDailyAccountIfDone $closeAccount,
    ) {}

    /** @param array{type: string, destination?: string|null, reason?: string|null, discharge_diagnosis: string} $data */
    public function handle(Admission $admission, User $user, int $doctorId, array $data): Discharge
    {
        return DB::transaction(function () use ($admission, $user, $doctorId, $data): Discharge {
            $admission = Admission::whereKey($admission->id)->lockForUpdate()->firstOrFail();
            if (! $admission->isActive()) {
                throw ValidationException::withMessages(['admission' => 'El paciente ya fue dado de alta.']);
            }

            $now = now();
            $admission->currentStay()->first()?->update(['ended_at' => $now]);
            foreach ($this->roomCharges->lines($admission, $now) as $line) {
                AccountCharge::create([
                    'account_id' => $admission->account_id,
                    'doctor_id' => $admission->doctor_id,
                    'created_by' => $user->id,
                    'type' => 'habitacion',
                    'description' => "Habitación {$line['room_type']} · {$line['bed_label']} ({$line['days']} ".($line['days'] === 1 ? 'día' : 'días').')',
                    'quantity' => $line['days'],
                    'unit_price' => $line['daily_price'],
                    'total' => $line['total'],
                    'source_type' => Admission::class,
                    'source_id' => $admission->id,
                ]);
            }

            $discharge = Discharge::create([
                'admission_id' => $admission->id,
                'patient_id' => $admission->patient_id,
                'doctor_id' => $doctorId,
                'type' => $data['type'],
                'destination' => $data['type'] === 'traslado' ? ($data['destination'] ?? null) : null,
                'reason' => $data['type'] === 'traslado' ? ($data['reason'] ?? null) : null,
                'discharge_diagnosis' => $data['discharge_diagnosis'],
                'created_by' => $user->id,
            ]);

            $admission->bed?->update(['status' => 'limpieza', 'cleaning_since' => $now]);
            $admission->update(['status' => 'alta', 'discharged_at' => $now, 'bed_id' => null]);

            $this->closeAccount->handle($admission->patient, $admission->account->service_date);

            return $discharge;
        });
    }
}
