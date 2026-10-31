<?php

namespace App\Support;

use App\Models\Emergency;
use App\Models\EmergencyApplication;
use App\Models\EmergencyCubicle;
use App\Models\EmergencyVital;
use App\Models\InventoryItem;
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
            'last_vital' => $e->latestVital?->summary(),
            'last_vital_time' => $e->latestVital?->taken_at->format('H:i'),
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
     * Readings, newest first.
     *
     * @return list<array<string, mixed>>
     */
    public function vitals(Emergency $e): array
    {
        return $e->vitals()->with('taker')->orderByDesc('taken_at')->orderByDesc('id')->get()
            ->map(fn (EmergencyVital $v): array => [
                'id' => $v->id,
                'time' => $v->taken_at->format('H:i'),
                'presion_arterial' => $v->presion_arterial,
                'frecuencia_cardiaca' => $v->frecuencia_cardiaca,
                'frecuencia_respiratoria' => $v->frecuencia_respiratoria,
                'temp' => $v->temp / 10,
                'saturacion_o2' => $v->saturacion_o2,
                'glucemia' => $v->glucemia,
                'taken_by' => $v->taker->name,
            ])->values()->all();
    }

    /**
     * Medications and supplies, in the order they were applied.
     *
     * @return list<array<string, mixed>>
     */
    public function applications(Emergency $e): array
    {
        return $e->applications()->with('applier')->orderBy('applied_at')->orderBy('id')->get()
            ->map(fn (EmergencyApplication $a): array => [
                'id' => $a->id,
                'kind' => $a->kind,
                'time' => $a->applied_at->format('H:i'),
                'description' => $a->description,
                'quantity' => $a->quantity,
                'route' => $a->route,
                'total' => $a->total,
                'brought_by_patient' => $a->brought_by_patient,
                'stock_left' => $a->stock_left,
                'applied_by' => $a->applier->name,
            ])->values()->all();
    }

    /**
     * Active catalog items that can be applied.
     *
     * @return list<array<string, mixed>>
     */
    public function catalog(): array
    {
        return InventoryItem::where('is_active', true)->orderBy('name')->get()
            ->map(fn (InventoryItem $i): array => [
                'id' => $i->id,
                'code' => $i->code,
                'name' => $i->name,
                'presentation' => $i->presentation,
                'kind' => $i->kind,
                'price' => $i->price,
                'stock' => $i->stock,
            ])->values()->all();
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
