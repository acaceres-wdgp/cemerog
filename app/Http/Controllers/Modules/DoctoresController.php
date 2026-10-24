<?php

namespace App\Http\Controllers\Modules;

use App\Actions\CreateDoctor;
use App\Actions\CreateSpecialty;
use App\Actions\UpdateDoctor;
use App\Actions\UpdateSpecialty;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDoctorRequest;
use App\Http\Requests\StoreSpecialtyRequest;
use App\Http\Requests\UpdateDoctorRequest;
use App\Http\Requests\UpdateSpecialtyRequest;
use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DoctoresController extends Controller
{
    public function index(): Response
    {
        $specialties = Specialty::withCount('doctors')->orderBy('name')->get();
        $doctors = Doctor::with('specialty')->orderBy('name')->get()->map(fn (Doctor $d) => [
            'id' => $d->id,
            'name' => $d->name,
            'exequatur' => $d->exequatur,
            'phone' => $d->phone,
            'specialty_id' => $d->specialty_id,
            'specialty_name' => $d->specialty->name,
            'is_active' => $d->is_active,
        ]);

        return Inertia::render('doctores/index', [
            'specialties' => $specialties,
            'doctors' => $doctors,
        ]);
    }

    public function storeSpecialty(StoreSpecialtyRequest $request, CreateSpecialty $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->route('doctores')
            ->with('flash', ['type' => 'success', 'message' => 'Especialidad creada correctamente.']);
    }

    public function updateSpecialty(UpdateSpecialtyRequest $request, Specialty $specialty, UpdateSpecialty $action): RedirectResponse
    {
        $action->handle($specialty, $request->validated());

        return redirect()->route('doctores')
            ->with('flash', ['type' => 'success', 'message' => 'Especialidad actualizada correctamente.']);
    }

    public function storeDoctor(StoreDoctorRequest $request, CreateDoctor $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->route('doctores')
            ->with('flash', ['type' => 'success', 'message' => 'Doctor registrado correctamente.']);
    }

    public function updateDoctor(UpdateDoctorRequest $request, Doctor $doctor, UpdateDoctor $action): RedirectResponse
    {
        $action->handle($doctor, $request->validated());

        return redirect()->route('doctores')
            ->with('flash', ['type' => 'success', 'message' => 'Doctor actualizado correctamente.']);
    }

    public function toggleDoctor(Doctor $doctor): RedirectResponse
    {
        $doctor->update(['is_active' => ! $doctor->is_active]);

        return redirect()->route('doctores')
            ->with('flash', ['type' => 'success', 'message' => 'Estado del doctor actualizado.']);
    }
}
