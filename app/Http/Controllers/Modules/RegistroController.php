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
    public function index(): Response
    {
        return Inertia::render('registro/index');
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->string('q'));

        if (mb_strlen($q) < 2) {
            return response()->json([]);
        }

        $patients = Patient::query()
            ->where(function ($query) use ($q) {
                $query->where('document_number', 'like', "%{$q}%")
                    ->orWhere('first_names', 'like', "%{$q}%")
                    ->orWhere('last_names', 'like', "%{$q}%")
                    ->orWhere('phone', 'like', "%{$q}%");
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
                'phone' => $p->phone,
                'address' => $p->address,
                'blood_type' => $p->blood_type,
                'allergies' => $p->allergies,
                'emergency_contact_name' => $p->emergency_contact_name,
                'emergency_contact_phone' => $p->emergency_contact_phone,
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
