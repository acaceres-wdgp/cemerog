<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConsultationRequest;
use App\Http\Requests\UpdateAntecedentRequest;
use App\Models\Consultation;
use App\Models\Patient;
use App\Models\PatientAntecedent;
use App\Models\Turn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConsultaController extends Controller
{
    public function index(Request $request): Response
    {
        $turnsEnConsulta = Turn::with(['patient', 'doctor.specialty'])
            ->whereDate('arrived_at', today())
            ->where('status', 'en_consulta')
            ->orderBy('turn_order')
            ->get()
            ->map(fn (Turn $t) => $this->formatTurn($t));

        $turnsEnEspera = Turn::with(['patient', 'doctor.specialty'])
            ->whereDate('arrived_at', today())
            ->where('status', 'espera')
            ->orderBy('turn_order')
            ->get()
            ->map(fn (Turn $t) => $this->formatTurn($t));

        $historial = [];
        $historialPatient = null;

        $patientId = $request->integer('patient_id');
        if ($patientId) {
            $patient = Patient::find($patientId);
            if ($patient) {
                $historial = $this->loadHistorial($patient);
                $historialPatient = $this->formatHistorialPatient($patient);
            }
        }

        return Inertia::render('consulta/index', [
            'turns_en_consulta' => $turnsEnConsulta,
            'turns_en_espera' => $turnsEnEspera,
            'historial' => $historial,
            'historial_patient' => $historialPatient,
        ]);
    }

    public function store(StoreConsultationRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Consultation::create($data);

        return redirect()
            ->to(route('consulta', ['patient_id' => $data['patient_id']]))
            ->with('flash', ['type' => 'success', 'message' => 'Consulta guardada exitosamente.']);
    }

    public function alta(Turn $turn): RedirectResponse
    {
        $turn->update(['status' => 'atendido']);

        return redirect()
            ->to(route('consulta'))
            ->with('flash', ['type' => 'success', 'message' => 'Paciente dado de alta.']);
    }

    public function updateAntecedents(UpdateAntecedentRequest $request, Patient $patient): RedirectResponse
    {
        PatientAntecedent::updateOrCreate(
            ['patient_id' => $patient->id],
            $request->validated(),
        );

        return redirect()->back()->with('flash', [
            'type' => 'success',
            'message' => 'Antecedentes actualizados.',
        ]);
    }

    private function loadHistorial(Patient $patient): array
    {
        return Consultation::with(['doctor.specialty'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('consulted_at')
            ->get()
            ->map(fn (Consultation $c) => [
                'id' => $c->id,
                'consulted_at' => $c->consulted_at,
                'doctor' => [
                    'id' => $c->doctor->id,
                    'full_name' => $c->doctor->full_name,
                    'specialty' => $c->doctor->specialty?->name,
                ],
                'motivo_consulta' => $c->motivo_consulta,
                'historia_enfermedad' => $c->historia_enfermedad,
                'examen_fisico' => $c->examen_fisico,
                'diagnosticos' => $c->diagnosticos,
                'plan_tratamiento' => $c->plan_tratamiento,
                'vitals' => [
                    'peso' => $c->peso,
                    'talla' => $c->talla,
                    'temp' => $c->temp,
                    'presion_arterial' => $c->presion_arterial,
                    'frecuencia_cardiaca' => $c->frecuencia_cardiaca,
                    'frecuencia_respiratoria' => $c->frecuencia_respiratoria,
                    'saturacion_o2' => $c->saturacion_o2,
                    'glucemia' => $c->glucemia,
                ],
            ])
            ->all();
    }

    private function formatHistorialPatient(Patient $patient): array
    {
        return [
            'id' => $patient->id,
            'full_name' => $patient->full_name,
            'age' => $patient->age,
            'sex' => $patient->sex,
            'allergies' => $patient->allergies,
            'antecedents' => $patient->antecedent,
        ];
    }

    private function formatTurn(Turn $turn): array
    {
        return [
            'id' => $turn->id,
            'turn_number' => $turn->turn_number,
            'turn_order' => $turn->turn_order,
            'status' => $turn->status,
            'arrived_at' => $turn->arrived_at,
            'patient' => [
                'id' => $turn->patient->id,
                'full_name' => $turn->patient->full_name,
                'age' => $turn->patient->age,
                'sex' => $turn->patient->sex,
                'allergies' => $turn->patient->allergies,
            ],
            'doctor' => [
                'id' => $turn->doctor->id,
                'full_name' => $turn->doctor->full_name,
                'specialty' => $turn->doctor->specialty?->name,
            ],
        ];
    }
}
