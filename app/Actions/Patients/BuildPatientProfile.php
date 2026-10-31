<?php

namespace App\Actions\Patients;

use App\Actions\BuildClinicalHistory;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Patient;
use App\Models\PatientAntecedent;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Support\Carbon;

/**
 * Everything the patient profile page shows, read-only.
 *
 * Finances are only included for users with Caja access or the administrador
 * role; for everyone else the key is null, so the data never reaches the browser.
 */
class BuildPatientProfile
{
    public function __construct(
        private readonly BuildClinicalHistory $buildClinicalHistory,
    ) {}

    /** @return array<string, mixed> */
    public function handle(Patient $patient, User $viewer): array
    {
        $patient->loadMissing('antecedent');

        $turnsQuery = Turn::where('patient_id', $patient->id);
        $lastArrivedAt = (clone $turnsQuery)->max('arrived_at');

        return [
            'patient' => $this->formatPatient($patient),
            'antecedentes' => $this->formatAntecedents($patient->antecedent),
            'stats' => [
                'atenciones' => (clone $turnsQuery)->count(),
                'ultima_atencion' => $lastArrivedAt ? Carbon::parse($lastArrivedAt)->format('d/m/Y') : null,
            ],
            'atenciones' => $this->attentions($patient),
            'historial' => $this->buildClinicalHistory->handle($patient, $viewer->doctor),
            'recetas' => $this->prescriptions($patient),
            // TODO(lab): análisis e imágenes cuando existan Laboratorio e Imágenes
            'estudios' => [],
            'finanzas' => $this->canSeeFinances($viewer) ? $this->finances($patient) : null,
            'can_print' => $viewer->canAttendPatients(),
        ];
    }

    public function canSeeFinances(User $user): bool
    {
        return $user->hasRole('administrador') || $user->can('module.caja.access');
    }

    /** @return array<string, mixed> */
    private function formatPatient(Patient $patient): array
    {
        return [
            'id' => $patient->id,
            'expediente_number' => $patient->expediente_number,
            'full_name' => $patient->full_name,
            'initials' => $patient->initials,
            'sex' => $patient->sex,
            'age' => $patient->age,
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'birth_date' => $patient->birth_date->format('d/m/Y'),
            'phone' => $patient->phone,
            'address' => $patient->address,
            'emergency_contact_name' => $patient->emergency_contact_name,
            'emergency_contact_phone' => $patient->emergency_contact_phone,
            'blood_type' => $patient->blood_type,
            'allergies' => $patient->allergies,
            'photo_url' => $patient->photo_url,
            'created_at' => $patient->created_at?->format('d/m/Y'),
        ];
    }

    /** @return array<string, string|null> */
    private function formatAntecedents(?PatientAntecedent $antecedent): array
    {
        return [
            'personales' => $antecedent?->personales,
            'quirurgicos' => $antecedent?->quirurgicos,
            'medicamentos' => $antecedent?->medicamentos,
            'familiares' => $antecedent?->familiares,
        ];
    }

    /** @return array<string, mixed> */
    private function attentions(Patient $patient): array
    {
        $paginator = Turn::with(['doctor.specialty', 'consultation', 'discharge'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('arrived_at')
            ->paginate(20, pageName: 'pagina')
            ->withQueryString();

        $paginator->getCollection()->transform(fn (Turn $t): array => [
            'id' => $t->id,
            'turn_number' => $t->turn_number,
            'date' => $t->arrived_at->format('d/m/Y'),
            'type' => 'Consulta',
            'status' => $t->status,
            'status_label' => Turn::statusLabel($t->status),
            'doctor' => $t->doctor->name,
            'specialty' => $t->doctor->specialty->name,
            'motivo' => $t->consultation?->motivo_consulta,
            'diagnostico' => $t->consultation?->diagnosticos[0]['label'] ?? null,
            'discharge' => $t->discharge ? [
                'type' => $t->discharge->type,
                'discharge_diagnosis' => $t->discharge->discharge_diagnosis,
            ] : null,
        ]);

        return $paginator->toArray();
    }

    /** @return list<array<string, mixed>> */
    private function prescriptions(Patient $patient): array
    {
        return Prescription::with(['items', 'doctor.specialty', 'consultation'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('prescribed_at')
            ->get()
            ->map(fn (Prescription $p): array => [
                'id' => $p->id,
                'date' => $p->prescribed_at->format('d/m/Y'),
                'doctor' => $p->doctor->name,
                'specialty' => $p->doctor->specialty->name,
                'diagnostico' => $p->consultation?->diagnosticos[0]['label'] ?? null,
                'general_instructions' => $p->general_instructions,
                'items' => $p->items->map(fn (PrescriptionItem $i): array => [
                    'id' => $i->id,
                    'position' => $i->position,
                    'medication' => $i->medication,
                    'route' => $i->route,
                    'dose' => $i->dose,
                    'frequency' => $i->frequency,
                    'duration_days' => $i->duration_days,
                    'is_continuous' => $i->is_continuous,
                    'quantity' => $i->quantity,
                ])->all(),
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function finances(Patient $patient): array
    {
        $accounts = Account::with(['charges.doctor'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('service_date')
            ->orderByDesc('id')
            ->get();

        $totalOf = fn (Account $a): int => (int) $a->charges->sum('total');

        $charged = $accounts->where('status', '!=', 'anulada')->sum($totalOf);
        $pending = $accounts->whereIn('status', ['abierta', 'pendiente_facturar'])->sum($totalOf);

        return [
            'cuentas' => $accounts->map(fn (Account $a): array => [
                'id' => $a->id,
                'service_date' => $a->service_date->format('d/m/Y'),
                'status' => $a->status,
                'total' => $totalOf($a),
                'charges' => $a->charges->map(fn (AccountCharge $c): array => [
                    'id' => $c->id,
                    'description' => $c->description,
                    'quantity' => $c->quantity,
                    'total' => $c->total,
                    'doctor' => $c->doctor?->name,
                ])->all(),
            ])->values()->all(),
            'total_cargado' => (int) $charged,
            'pendiente_facturar' => (int) $pending,
            // TODO(caja): facturas y pagos cuando exista Caja
            'facturas' => [],
            'pagos' => [],
        ];
    }
}
