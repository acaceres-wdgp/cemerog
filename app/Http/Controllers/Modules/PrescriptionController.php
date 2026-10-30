<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrescriptionRequest;
use App\Models\Prescription;
use App\Models\Turn;
use App\Models\User;
use App\Support\AllergyChecker;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionController extends Controller
{
    /**
     * Store a new prescription for the given turn.
     * Returns 201 on success.
     */
    public function store(StorePrescriptionRequest $request, Turn $turn): JsonResponse
    {
        if (Prescription::where('turn_id', $turn->id)->exists()) {
            throw ValidationException::withMessages([
                'turn_id' => 'Este turno ya tiene una receta registrada.',
            ]);
        }

        $this->checkDischargelock($turn);

        /** @var User $user */
        $user = $request->user();

        $validated = $request->validated();

        $this->checkAllergies($turn, $validated['items'] ?? []);

        DB::transaction(function () use ($turn, $validated, $user): void {
            $prescription = Prescription::create([
                'turn_id' => $turn->id,
                'consultation_id' => $turn->consultation?->id,
                'patient_id' => $turn->patient_id,
                'doctor_id' => $turn->doctor_id,
                'general_instructions' => $validated['general_instructions'] ?? null,
                'created_by' => $user->id,
                'prescribed_at' => now(),
            ]);

            foreach ($validated['items'] ?? [] as $item) {
                $prescription->items()->create([
                    'position' => $item['position'],
                    'medication' => $item['medication'],
                    'route' => $item['route'] ?? null,
                    'dose' => $item['dose'],
                    'frequency' => $item['frequency'],
                    'duration_days' => ($item['is_continuous'] ?? false) ? null : ($item['duration_days'] ?? null),
                    'is_continuous' => $item['is_continuous'] ?? false,
                    'quantity' => $item['quantity'],
                ]);
            }
        });

        return response()->json(['message' => 'Receta guardada.'], 201);
    }

    /**
     * Update the prescription for the given turn.
     */
    public function update(StorePrescriptionRequest $request, Turn $turn): JsonResponse
    {
        $this->checkDischargelock($turn);

        $validated = $request->validated();

        $this->checkAllergies($turn, $validated['items'] ?? []);

        /** @var Prescription $prescription */
        $prescription = Prescription::where('turn_id', $turn->id)->firstOrFail();

        DB::transaction(function () use ($prescription, $validated): void {
            $prescription->update([
                'general_instructions' => $validated['general_instructions'] ?? null,
            ]);

            $prescription->items()->delete();

            foreach ($validated['items'] ?? [] as $item) {
                $prescription->items()->create([
                    'position' => $item['position'],
                    'medication' => $item['medication'],
                    'route' => $item['route'] ?? null,
                    'dose' => $item['dose'],
                    'frequency' => $item['frequency'],
                    'duration_days' => ($item['is_continuous'] ?? false) ? null : ($item['duration_days'] ?? null),
                    'is_continuous' => $item['is_continuous'] ?? false,
                    'quantity' => $item['quantity'],
                ]);
            }
        });

        return response()->json(['message' => 'Receta actualizada.']);
    }

    /**
     * Show the printable prescription document.
     */
    public function print(Request $request, Prescription $prescription): Response
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->canAttendPatients()) {
            abort(403);
        }

        $prescription->load(['items', 'patient', 'doctor.specialty', 'turn.discharge']);

        return Inertia::render('consulta/receta-imprimir', [
            'prescription' => $this->formatPrescription($prescription),
            'clinic' => [
                'name' => config('cemerog.clinic.name'),
                'rnc' => config('cemerog.clinic.rnc'),
                'phone' => config('cemerog.clinic.phone'),
                'address' => config('cemerog.clinic.address'),
            ],
        ]);
    }

    private function checkDischargelock(Turn $turn): void
    {
        if (! $turn->isOpenToday()) {
            abort(403, 'La receta solo puede modificarse en un turno abierto del día.');
        }

        if ($turn->discharge !== null) {
            abort(403, 'La receta no puede modificarse después del alta.');
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    private function checkAllergies(Turn $turn, array $items): void
    {
        $allergies = $turn->patient->allergies;
        if ($allergies === null || $allergies === '') {
            return;
        }

        $allergyWords = array_filter(array_map(
            fn (string $a) => mb_strtolower(trim(AllergyChecker::normalize($a))),
            preg_split('/[,;]+/', $allergies) ?: []
        ));

        foreach ($items as $item) {
            $medNormalized = mb_strtolower(AllergyChecker::normalize($item['medication']));
            foreach ($allergyWords as $word) {
                if (str_contains($medNormalized, $word)) {
                    throw ValidationException::withMessages([
                        'allergy' => [
                            'message' => "El medicamento \"{$item['medication']}\" coincide con una alergia del paciente.",
                            'medication' => $item['medication'],
                        ],
                    ]);
                }
            }
        }
    }

    /** @return array<string, mixed> */
    private function formatPrescription(Prescription $prescription): array
    {
        return [
            'id' => $prescription->id,
            'general_instructions' => $prescription->general_instructions,
            'prescribed_at' => $prescription->prescribed_at,
            'patient' => [
                'full_name' => $prescription->patient->full_name,
                'age' => $prescription->patient->age,
                'sex' => $prescription->patient->sex,
                'allergies' => $prescription->patient->allergies,
            ],
            'doctor' => [
                'name' => $prescription->doctor->name,
                'exequatur' => $prescription->doctor->exequatur,
                'specialty' => $prescription->doctor->specialty->name,
            ],
            'turn_number' => $prescription->turn->turn_number,
            'items' => $prescription->items->map(fn ($item) => [
                'id' => $item->id,
                'position' => $item->position,
                'medication' => $item->medication,
                'route' => $item->route,
                'dose' => $item->dose,
                'frequency' => $item->frequency,
                'duration_days' => $item->duration_days,
                'is_continuous' => $item->is_continuous,
                'quantity' => $item->quantity,
            ])->all(),
        ];
    }
}
