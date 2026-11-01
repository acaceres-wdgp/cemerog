<?php

namespace App\Support;

use App\Actions\Internamiento\RoomCharges;
use App\Http\Requests\SurgeryRequest;
use App\Models\AccountCharge;
use App\Models\Admission;
use App\Models\AdmissionNote;
use App\Models\AdmissionStay;
use App\Models\Bed;
use App\Models\Doctor;
use App\Models\Room;
use App\Models\Surgery;
use App\Models\User;

/** Internamiento data for the pages */
class AdmissionPresenter
{
    /**
     * The bed map: rooms with their beds and who is in each.
     *
     * @return list<array<string, mixed>>
     */
    public function rooms(): array
    {
        return Room::with(['type', 'beds.admission.patient', 'beds.admission.doctor'])
            ->orderBy('position')->orderBy('id')->get()
            ->map(fn (Room $r): array => [
                'id' => $r->id,
                'name' => $r->name,
                'type' => $r->type->name,
                'daily_price' => $r->type->daily_price,
                'beds' => $r->beds->map(fn (Bed $b): array => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'label' => "{$r->name} · {$b->name}",
                    'status' => $b->status,
                    'cleaning_since' => $b->cleaning_since?->format('H:i'),
                    'admission' => $b->admission !== null ? $this->summary($b->admission) : null,
                ])->all(),
            ])->values()->all();
    }

    /**
     * What the admission dialog needs: free beds and doctors.
     *
     * @return array{beds: list<array<string, mixed>>, doctors: list<array<string, mixed>>, default_doctor_id: int|null, surgery: array<string, mixed>|null}
     */
    public function options(?User $user): array
    {
        return [
            'beds' => Bed::with('room.type')->where('status', 'libre')->get()
                ->sortBy(fn (Bed $b): string => sprintf('%05d-%s', $b->room->position, $b->name))
                ->map(fn (Bed $b): array => [
                    'id' => $b->id,
                    'label' => $b->label(),
                    'type' => $b->room->type->name,
                    'daily_price' => $b->room->type->daily_price,
                ])->values()->all(),
            'doctors' => Doctor::with('specialty')->where('is_active', true)->orderBy('name')->get()
                ->map(fn (Doctor $d): array => ['id' => $d->id, 'name' => $d->name, 'specialty' => $d->specialty->name])->values()->all(),
            'default_doctor_id' => $user?->doctor?->is_active ? $user->doctor->id : null,
            // «Ingreso para cirugía», for whoever can schedule surgeries
            'surgery' => $user !== null && SurgeryRequest::canSchedule($user) ? app(SurgeryPresenter::class)->options() : null,
        ];
    }

    /**
     * The header of the ficha.
     *
     * @return array<string, mixed>
     */
    public function detail(Admission $a): array
    {
        $a->loadMissing(['patient', 'doctor', 'bed.room.type', 'stays']);
        $p = $a->patient;
        $stay = $a->stays->last();

        return [
            ...$this->summary($a),
            'origin' => Admission::ORIGINS[$a->origin] ?? $a->origin,
            'treatment' => $a->treatment,
            'bed_label' => $a->bed?->label() ?? $stay?->bed_label,
            'room_type' => $stay?->room_type,
            'daily_price' => $stay?->daily_price,
            'discharged_at' => $a->discharged_at?->format('d/m/Y H:i'),
            'patient' => [
                'id' => $p->id,
                'full_name' => $p->full_name,
                'age' => $p->age,
                'sex' => $p->sex,
                'document_number' => $p->document_type === 'no_tiene' ? null : $p->document_number,
                'expediente_number' => $p->expediente_number,
                'allergies' => $p->allergies,
                'blood_type' => $p->blood_type,
            ],
            'stays' => $a->stays->map(fn (AdmissionStay $s): array => [
                'bed_label' => $s->bed_label,
                'room_type' => $s->room_type,
                'started_at' => $s->started_at->format('d/m/Y H:i'),
                'reason' => $s->reason,
            ])->all(),
        ];
    }

    /**
     * Nursing notes, newest first.
     *
     * @return list<array<string, mixed>>
     */
    public function notes(Admission $a): array
    {
        return $a->notes()->with('author')->get()
            ->map(fn (AdmissionNote $n): array => [
                'id' => $n->id,
                'body' => $n->body,
                'shift' => $n->shift,
                'author' => $n->author->name,
                'at' => $n->created_at->format('d/m/Y H:i'),
            ])->values()->all();
    }

    /**
     * Charges of the stay's account plus the room so far (charged at discharge).
     *
     * @return array{charges: list<array<string, mixed>>, room: list<array<string, mixed>>, room_charged: bool, by_area: array<string, int>, total: int}
     */
    public function charges(Admission $a): array
    {
        $charges = AccountCharge::where('account_id', $a->account_id)->orderBy('created_at')->orderBy('id')->get();
        $roomCharged = $charges->contains(fn (AccountCharge $c): bool => $c->type === 'habitacion');
        $room = $roomCharged ? [] : app(RoomCharges::class)->lines($a);

        $byArea = [];
        foreach ($charges as $c) {
            $area = InvoicePresenter::area($c->type);
            $byArea[$area] = ($byArea[$area] ?? 0) + $c->total;
        }
        $roomTotal = array_sum(array_column($room, 'total'));
        if ($roomTotal > 0) {
            $byArea['Habitación'] = ($byArea['Habitación'] ?? 0) + $roomTotal;
        }

        return [
            'charges' => $charges->map(fn (AccountCharge $c): array => [
                'id' => $c->id,
                'date' => $c->created_at->format('d/m/Y'),
                'description' => $c->description,
                'area' => InvoicePresenter::area($c->type),
                'quantity' => $c->quantity,
                'unit_price' => $c->unit_price,
                'total' => $c->total,
            ])->values()->all(),
            'room' => $room,
            'room_charged' => $roomCharged,
            'by_area' => $byArea,
            'total' => (int) $charges->sum('total') + $roomTotal,
        ];
    }

    /** @return array<string, mixed> */
    public function summary(Admission $a): array
    {
        $a->loadMissing(['patient', 'doctor']);

        return [
            'id' => $a->id,
            'number' => $a->number,
            'status' => $a->status,
            'patient' => ['id' => $a->patient->id, 'full_name' => $a->patient->full_name],
            'diagnosis' => trim(($a->diagnosis_code !== null ? $a->diagnosis_code.' ' : '').$a->diagnosis_label),
            'day' => $a->dayNumber(),
            'doctor' => $a->doctor->name,
            'admitted_at' => $a->admitted_at->format('d/m/Y H:i'),
            // «Internado por cirugía» while a surgery is pending
            'for_surgery' => Surgery::pending()->where('admission_id', $a->id)->exists(),
        ];
    }
}
