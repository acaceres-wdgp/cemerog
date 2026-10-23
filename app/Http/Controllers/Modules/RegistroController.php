<?php

namespace App\Http\Controllers\Modules;

use App\Actions\CreatePatient;
use App\Actions\UpdatePatient;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RegistroController extends Controller
{
    public function index(Request $request): Response
    {
        $patients = Patient::query()
            ->when($request->filled('q'), function ($query) use ($request) {
                $q = (string) $request->string('q');
                $docHash = hash_hmac('sha256', $q, config('app.key'));
                $query->where(function ($inner) use ($q, $docHash) {
                    $inner->where('document_number_hash', $docHash)
                        ->orWhere('first_names', 'like', "%{$q}%")
                        ->orWhere('last_names', 'like', "%{$q}%");
                });
            })
            ->orderBy('last_names')
            ->orderBy('first_names')
            ->paginate(20)
            ->withQueryString();

        $patients->getCollection()->transform(fn (Patient $p) => array_merge($p->toArray(), [
            'full_name' => $p->full_name,
            'initials' => $p->initials,
            'age' => $p->age,
            'document_number' => $p->document_number,
            'email' => $p->email,
            'phone' => $p->phone,
            'photo_url' => $p->photo_url,
        ]));

        return Inertia::render('registro/index', [
            'patients' => $patients,
            'filters' => $request->only('q'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('registro/create');
    }

    public function edit(Patient $patient): Response
    {
        return Inertia::render('registro/edit', [
            'patient' => array_merge($patient->toArray(), [
                'full_name' => $patient->full_name,
                'initials' => $patient->initials,
                'age' => $patient->age,
                'document_number' => $patient->document_number,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'photo_url' => $patient->photo_url,
            ]),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        // document_number is encrypted – search by HMAC hash for exact match.
        // phone is also encrypted – cannot be searched via LIKE.
        $docHash = hash_hmac('sha256', $q, config('app.key'));

        $patients = Patient::query()
            ->where(function ($query) use ($q, $docHash) {
                $query->where('document_number_hash', $docHash)
                    ->orWhere('first_names', 'like', "%{$q}%")
                    ->orWhere('last_names', 'like', "%{$q}%");
            })
            ->limit(10)
            ->get()
            ->map(fn (Patient $p) => [
                'id' => $p->id,
                'full_name' => $p->full_name,
                'initials' => $p->initials,
                'document_type' => $p->document_type,
                'document_number' => $p->document_number,
                'first_names' => $p->first_names,
                'last_names' => $p->last_names,
                'birth_date' => $p->birth_date->format('Y-m-d'),
                'age' => $p->age,
                'sex' => $p->sex,
                'email' => $p->email,
                'phone' => $p->phone,
                'address' => $p->address,
                'blood_type' => $p->blood_type,
                'allergies' => $p->allergies,
                'emergency_contact_name' => $p->emergency_contact_name,
                'emergency_contact_phone' => $p->emergency_contact_phone,
                'photo_url' => $p->photo_url,
            ]);

        return response()->json($patients);
    }

    public function store(StorePatientRequest $request, CreatePatient $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->route('registro')
            ->with('flash', ['type' => 'success', 'message' => 'Paciente registrado correctamente.']);
    }

    public function update(UpdatePatientRequest $request, Patient $patient, UpdatePatient $action): RedirectResponse
    {
        $action->handle($patient, $request->validated());

        return redirect()->route('registro')
            ->with('flash', ['type' => 'success', 'message' => 'Datos del paciente actualizados.']);
    }

    public function destroy(Patient $patient): RedirectResponse
    {
        abort_unless(auth()->user()?->can('module.registro.access'), 403);

        $patient->delete();

        return redirect()->route('registro')
            ->with('flash', ['type' => 'success', 'message' => 'Paciente eliminado.']);
    }
}
