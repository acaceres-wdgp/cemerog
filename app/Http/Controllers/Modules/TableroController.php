<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Turn;
use Inertia\Inertia;
use Inertia\Response;

class TableroController extends Controller
{
    public function index(): Response
    {
        // Active turns for today, ordered by turn_order
        $turns = Turn::with(['patient', 'doctor.specialty'])
            ->whereDate('arrived_at', today())
            ->whereIn('status', ['espera', 'en_consulta'])
            ->orderBy('turn_order')
            ->get()
            ->map(fn (Turn $t) => [
                'id'               => $t->id,
                'turn_number'      => $t->turn_number,
                'turn_order'       => $t->turn_order,
                'patient_name'     => $t->patient->full_name,
                'patient_initials' => $t->patient->initials,
                'patient_document' => $t->patient->document_number,
                'patient_age'      => $t->patient->age,
                'patient_sex'      => $t->patient->sex,
                'doctor_id'        => $t->doctor_id,
                'doctor_name'      => $t->doctor->name,
                'doctor_specialty' => $t->doctor->specialty?->name ?? '—',
                'arrived_at'       => $t->arrived_at->format('H:i'),
                'status'           => $t->status,
                'appointment_id'   => $t->appointment_id,
            ]);

        // Today's appointments (excluding cancelled), with turn info
        $appointments = Appointment::with(['patient', 'doctor.specialty', 'turn'])
            ->whereDate('appointment_date', today())
            ->whereNotIn('status', ['cancelada'])
            ->orderBy('appointment_time')
            ->get()
            ->map(fn (Appointment $a) => [
                'id'               => $a->id,
                'appointment_time' => $a->appointment_time,
                'patient_id'       => $a->patient_id,
                'patient_name'     => $a->patient->full_name,
                'patient_initials' => $a->patient->initials,
                'patient_phone'    => $a->patient->phone,
                'doctor_id'        => $a->doctor_id,
                'doctor_name'      => $a->doctor->name,
                'doctor_specialty' => $a->doctor->specialty?->name ?? '—',
                'type'             => $a->type,
                'status'           => $a->status,
                'notes'            => $a->notes,
                'turn_number'      => $a->turn?->turn_number,
                'has_turn'         => $a->turn !== null,
            ]);

        $doctors = Doctor::with('specialty')
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (Doctor $d) => [
                'id'       => $d->id,
                'name'     => $d->name,
                'specialty' => $d->specialty?->name ?? '—',
                'initials' => collect(explode(' ', (string) preg_replace('/^(Dr\.|Dra\.)\s*/i', '', $d->name)))
                    ->map(fn (string $w) => strtoupper($w[0] ?? ''))
                    ->take(2)
                    ->join(''),
            ]);

        return Inertia::render('tablero/index', [
            'turns'       => $turns->values(),
            'appointments' => $appointments->values(),
            'doctors'     => $doctors->values(),
            'en_espera'   => $turns->count(),
        ]);
    }
}
