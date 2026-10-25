<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Patients\SearchPatients;
use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Turn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PacientesController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->string('q'));
        $filter = $request->string('filter', 'todos')->toString();
        $sort = $request->string('sort', 'ultima_atencion')->toString();
        $today = Carbon::today('America/Santo_Domingo')->toDateString();

        // ── Base query (search only, no filter) ───────────────────────────────────
        $baseQuery = Patient::query();

        if (mb_strlen($q) >= 3) {
            $digitsOnly = preg_replace('/[^\d]/', '', $q) ?? '';

            if ($digitsOnly !== '' && ! preg_match('/[a-zA-ZÀ-ÖØ-öø-ÿ]/', $q)) {
                $hash = hash_hmac('sha256', $digitsOnly, config('app.key'));
                $baseQuery->where(function ($inner) use ($hash) {
                    $inner->where('document_number_hash', $hash)
                        ->orWhere('phone_hash', $hash);
                });
            } else {
                $words = preg_split('/\s+/', $q, -1, PREG_SPLIT_NO_EMPTY) ?: [$q];
                foreach ($words as $word) {
                    $baseQuery->where(function ($inner) use ($word) {
                        $inner->where('first_names', 'like', "%{$word}%")
                            ->orWhere('last_names', 'like', "%{$word}%");
                    });
                }
            }
        }

        // ── Segment counts (computed over search results, all filters) ────────────
        $counts = [
            'total' => (clone $baseQuery)->count(),
            'attended_today' => (clone $baseQuery)->whereHas('turns', fn ($t) => $t->whereDate('arrived_at', $today))->count(),
            'con_alergias' => (clone $baseQuery)->whereNotNull('allergies')->count(),
            'sin_atenciones' => (clone $baseQuery)->whereDoesntHave('turns')->count(),
        ];

        // ── Apply filter ──────────────────────────────────────────────────────────
        $query = clone $baseQuery;
        match ($filter) {
            'atendidos_hoy' => $query->whereHas('turns', fn ($t) => $t->whereDate('arrived_at', $today)),
            'con_alergias' => $query->whereNotNull('allergies'),
            'sin_atenciones' => $query->whereDoesntHave('turns'),
            default => null,
        };

        // ── Sort ──────────────────────────────────────────────────────────────────
        match ($sort) {
            'nombre' => $query->orderBy('last_names')->orderBy('first_names'),
            'registro' => $query->orderBy('created_at'),
            default => $query->withMax('turns as last_arrived_at_sort', 'arrived_at')
                ->orderByDesc('last_arrived_at_sort'),
        };

        // ── Eager load to prevent N+1 ─────────────────────────────────────────────
        $query->with(['latestTurn.doctor'])
            ->withExists([
                'turns as attended_today' => fn ($t) => $t->whereDate('arrived_at', $today),
            ]);

        $paginator = $query->paginate(15)->withQueryString();

        // ── Map for the frontend ──────────────────────────────────────────────────
        $paginator->getCollection()->transform(function (Patient $p): array {
            /** @var Turn|null $lastTurn */
            $lastTurn = $p->latestTurn;

            return [
                'id' => $p->id,
                'expediente_number' => $p->expediente_number,
                'full_name' => $p->full_name,
                'initials' => $p->initials,
                'first_names' => $p->first_names,
                'last_names' => $p->last_names,
                'document_type' => $p->document_type,
                'document_number' => $p->document_number,
                'sex' => $p->sex,
                'age' => $p->age,
                'birth_date' => $p->birth_date->format('Y-m-d'),
                'phone' => $p->phone,
                'blood_type' => $p->blood_type,
                'allergies' => $p->allergies,
                'photo_url' => $p->photo_url,
                'attended_today' => (bool) $p->getAttribute('attended_today'),
                'last_attended_at' => $lastTurn?->arrived_at
                    ? Carbon::parse($lastTurn->arrived_at)->format('d/m/Y')
                    : null,
                'last_turn_type' => $lastTurn ? 'Consulta' : null,
                'last_turn_doctor' => $lastTurn?->doctor?->name,
            ];
        });

        $validFilters = ['todos', 'atendidos_hoy', 'con_alergias', 'sin_atenciones'];
        $validSorts = ['ultima_atencion', 'nombre', 'registro'];

        return Inertia::render('pacientes/index', [
            'patients' => $paginator,
            'counts' => $counts,
            'filters' => [
                'q' => $q,
                'filter' => in_array($filter, $validFilters) ? $filter : 'todos',
                'sort' => in_array($sort, $validSorts) ? $sort : 'ultima_atencion',
            ],
            'selected' => $this->resolveSelected($request),
        ]);
    }

    /**
     * Resolve the selected patient for the detail panel.
     *
     * @return array<string, mixed>|null
     */
    private function resolveSelected(Request $request): ?array
    {
        $id = $request->integer('paciente');
        if (! $id) {
            return null;
        }

        $patient = Patient::find($id);
        if (! $patient) {
            return null;
        }

        $recentTurns = Turn::with('doctor.specialty')
            ->where('patient_id', $patient->id)
            ->orderByDesc('arrived_at')
            ->limit(4)
            ->get()
            ->map(fn (Turn $t) => [
                'id' => $t->id,
                'turn_number' => $t->turn_number,
                'arrived_at' => Carbon::parse($t->arrived_at)->format('d/m/Y'),
                'status' => $t->status,
                'doctor_name' => $t->doctor->name,
                'doctor_specialty' => $t->doctor->specialty->name,
                'notes' => $t->notes,
                'type' => 'Consulta',
            ])
            ->all();

        $totalTurns = Turn::where('patient_id', $patient->id)->count();

        return [
            'id' => $patient->id,
            'expediente_number' => $patient->expediente_number,
            'full_name' => $patient->full_name,
            'initials' => $patient->initials,
            'first_names' => $patient->first_names,
            'last_names' => $patient->last_names,
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'sex' => $patient->sex,
            'age' => $patient->age,
            'birth_date' => $patient->birth_date->format('d/m/Y'),
            'phone' => $patient->phone,
            'address' => $patient->address,
            'blood_type' => $patient->blood_type,
            'allergies' => $patient->allergies,
            'emergency_contact_name' => $patient->emergency_contact_name,
            'emergency_contact_phone' => $patient->emergency_contact_phone,
            'photo_url' => $patient->photo_url,
            'created_at' => $patient->created_at?->format('d/m/Y'),
            'recent_turns' => $recentTurns,
            'total_turns' => $totalTurns,
        ];
    }

    public function search(Request $request, SearchPatients $searchPatients): JsonResponse
    {
        $q = trim((string) $request->string('q'));
        $results = $searchPatients->handle($q);

        $today = Carbon::today('America/Santo_Domingo')->toDateString();

        return response()->json(
            $results->map(fn (Patient $p) => [
                'id' => $p->id,
                'expediente_number' => $p->expediente_number,
                'full_name' => $p->full_name,
                'initials' => $p->initials,
                'document_type' => $p->document_type,
                'document_number' => $p->document_number,
                'first_names' => $p->first_names,
                'last_names' => $p->last_names,
                'birth_date' => $p->birth_date->format('Y-m-d'),
                'age' => $p->age,
                'sex' => $p->sex,
                'phone' => $p->phone,
                'address' => $p->address,
                'blood_type' => $p->blood_type,
                'allergies' => $p->allergies,
                'emergency_contact_name' => $p->emergency_contact_name,
                'emergency_contact_phone' => $p->emergency_contact_phone,
                'photo_url' => $p->photo_url,
                'open_turns_today' => $p->turns()
                    ->with('doctor')
                    ->whereDate('arrived_at', $today)
                    ->whereIn('status', ['espera', 'en_consulta'])
                    ->get()
                    ->map(fn (Turn $t) => [
                        'doctor_name' => $t->doctor->name,
                        'status' => $t->status,
                    ])
                    ->values()
                    ->all(),
                'last_attended_at' => $p->turns()->max('arrived_at')
                    ? Carbon::parse($p->turns()->max('arrived_at'))->format('d/m/Y')
                    : null,
                'total_turns' => $p->turns()->count(),
            ])
        );
    }
}
