<?php

namespace App\Support;

use App\Models\Doctor;
use App\Models\OperatingRoom;
use App\Models\Surgery;
use App\Models\SurgeryProcedure;

/** Cirugía data for the pages */
class SurgeryPresenter
{
    private const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    /** @return array<string, mixed> */
    public function block(Surgery $s): array
    {
        $s->loadMissing(['patient', 'surgeon', 'anesthetist', 'operatingRoom', 'admission.bed.room']);
        $bed = $s->admission?->bed;

        return [
            'id' => $s->id,
            'number' => $s->number,
            'procedure' => $s->procedure_name,
            'price' => $s->price,
            'status' => $s->status,
            'patient' => ['id' => $s->patient->id, 'full_name' => $s->patient->full_name],
            'surgeon' => $s->surgeon->name,
            'surgeon_id' => $s->surgeon_id,
            'anesthetist' => $s->anesthetist?->name,
            'operating_room' => $s->operatingRoom->name,
            'operating_room_id' => $s->operating_room_id,
            'room' => $bed !== null ? "{$bed->room->name} · {$bed->name}" : ($s->admission_id !== null ? 'Internado (egresado)' : 'Ambulatoria'),
            'date' => $s->starts_at->toDateString(),
            'date_label' => self::DAYS[$s->starts_at->dayOfWeekIso - 1].' '.$s->starts_at->format('d/m/Y'),
            'start' => $s->starts_at->format('H:i'),
            'end' => $s->ends_at->format('H:i'),
            'duration_minutes' => (int) $s->starts_at->diffInMinutes($s->ends_at),
            'notes' => $s->notes,
            'cancel_reason' => $s->cancel_reason,
        ];
    }

    /**
     * What the scheduling dialog needs.
     *
     * @return array{procedures: list<array<string, mixed>>, operating_rooms: list<array{id: int, name: string}>, doctors: list<array<string, mixed>>}
     */
    public function options(): array
    {
        return [
            'procedures' => SurgeryProcedure::where('is_active', true)->orderBy('code')->get()
                ->map(fn (SurgeryProcedure $p): array => [
                    'id' => $p->id, 'code' => $p->code, 'name' => $p->name, 'price' => $p->price, 'duration_minutes' => $p->duration_minutes,
                ])->values()->all(),
            'operating_rooms' => OperatingRoom::active()->get()
                ->map(fn (OperatingRoom $r): array => ['id' => $r->id, 'name' => $r->name])->values()->all(),
            'doctors' => Doctor::with('specialty')->where('is_active', true)->orderBy('name')->get()
                ->map(fn (Doctor $d): array => ['id' => $d->id, 'name' => $d->name, 'specialty' => $d->specialty->name])->values()->all(),
        ];
    }
}
