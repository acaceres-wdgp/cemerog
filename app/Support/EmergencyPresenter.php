<?php

namespace App\Support;

use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use Illuminate\Support\Collection;

/** Shapes emergencies for the board and the detail */
class EmergencyPresenter
{
    /** @return array<string, mixed> */
    public function row(Emergency $e): array
    {
        $p = $e->patient;

        return [
            'id' => $e->id,
            'number' => $e->number,
            'status' => $e->status,
            'arrived_at' => $e->arrived_at->toIso8601String(),
            'arrived_time' => $e->arrived_at->format('H:i'),
            'reason' => $e->reason,
            'doctor' => $e->doctor->name,
            'cubicle' => ['id' => $e->cubicle->id, 'name' => $e->cubicle->name],
            'patient' => [
                'id' => $p->id,
                'full_name' => $p->full_name,
                'sex' => $p->sex,
                'age' => $p->age,
                'document_number' => $p->document_type === 'no_tiene' ? null : $p->document_number,
                'profile_incomplete' => $p->profile_incomplete,
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function detail(Emergency $e): array
    {
        $e->loadMissing(['patient', 'doctor', 'cubicle', 'account.charges']);
        $p = $e->patient;
        $charges = $e->account->charges;

        return [
            ...$this->row($e),
            'arrived_on' => $e->arrived_at->format('d/m/Y H:i'),
            'patient' => [
                ...$this->row($e)['patient'],
                'document_type' => $p->document_type,
                'birth_date' => $p->birth_date?->format('d/m/Y'),
                'phone' => $p->phone,
                'allergies' => $p->allergies,
                'blood_type' => $p->blood_type,
                'emergency_contact_name' => $p->emergency_contact_name,
                'expediente_number' => $p->expediente_number,
            ],
            'account' => [
                'id' => $e->account->id,
                'total' => (int) $charges->sum('total'),
                'charges_count' => $charges->count(),
            ],
        ];
    }

    /**
     * Active cubicles with the patient in each one.
     *
     * @param  Collection<int, Emergency>  $active
     * @return list<array<string, mixed>>
     */
    public function cubicles(Collection $active): array
    {
        $byCubicle = $active->keyBy('occupied_cubicle_id');

        return EmergencyCubicle::active()->get()
            ->map(function (EmergencyCubicle $c) use ($byCubicle): array {
                $e = $byCubicle->get($c->id);

                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'emergency_id' => $e?->id,
                    'patient' => $e !== null ? $this->shortName($e) : null,
                ];
            })
            ->values()
            ->all();
    }

    private function shortName(Emergency $e): string
    {
        $first = $e->patient->first_names;

        return $first === 'N.N.' ? 'N.N.' : (explode(' ', $first)[0]);
    }
}
