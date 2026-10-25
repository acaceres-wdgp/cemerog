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
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DoctoresController extends Controller
{
    public function index(): Response
    {
        $specialties = Specialty::withCount('doctors')->orderBy('name')->get();
        $doctors = Doctor::with(['specialty', 'user'])->orderBy('name')->get()->map(fn (Doctor $d) => [
            'id' => $d->id,
            'name' => $d->name,
            'exequatur' => $d->exequatur,
            'phone' => $d->phone,
            'specialty_id' => $d->specialty_id,
            'specialty_name' => $d->specialty->name,
            'is_active' => $d->is_active,
            'user_id' => $d->user_id,
            'user_name' => $d->user?->name,
            'office' => $d->office,
        ]);

        // Available medico users: those with the medico role not yet linked to any doctor
        $linkedUserIds = Doctor::whereNotNull('user_id')->pluck('user_id');
        $availableUsers = User::role('medico')
            ->whereNotIn('id', $linkedUserIds)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('doctores/index', [
            'specialties' => $specialties,
            'doctors' => $doctors,
            'availableUsers' => $availableUsers,
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
