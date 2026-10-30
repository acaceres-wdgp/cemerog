<?php

namespace App\Http\Controllers\Modules;

use App\Actions\CreateDoctor;
use App\Actions\CreateSpecialty;
use App\Actions\Doctors\ResetDoctorPassword;
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
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
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
            'user_username' => $d->user?->username,
            'office' => $d->office,
            'consultation_price' => $d->consultation_price,
            'consultation_fee' => $d->consultation_fee,
        ]);

        // Available users for linking: active users NOT already linked to a doctor
        $linkedUserIds = Doctor::whereNotNull('user_id')->pluck('user_id');
        $availableUsers = User::where('is_active', true)
            ->whereNotIn('id', $linkedUserIds)
            ->orderBy('name')
            ->get(['id', 'name', 'username']);

        return Inertia::render('doctores/index', [
            'specialties' => $specialties,
            'doctors' => $doctors,
            'availableUsers' => $availableUsers,
        ]);
    }

    public function storeSpecialty(StoreSpecialtyRequest $request, CreateSpecialty $action): RedirectResponse
    {
        $action->handle($request->validated());

        Toast::success('Especialidad creada correctamente.');

        return redirect()->route('doctores');
    }

    public function updateSpecialty(UpdateSpecialtyRequest $request, Specialty $specialty, UpdateSpecialty $action): RedirectResponse
    {
        $action->handle($specialty, $request->validated());

        Toast::success('Especialidad actualizada correctamente.');

        return redirect()->route('doctores');
    }

    public function storeDoctor(StoreDoctorRequest $request, CreateDoctor $action): RedirectResponse
    {
        $result = $action->handle($request->validated());

        if ($result['credentials'] !== null) {
            Inertia::flash('credentials', $result['credentials']);
        }

        Toast::success('Doctor registrado correctamente.');

        return redirect()->route('doctores');
    }

    public function updateDoctor(UpdateDoctorRequest $request, Doctor $doctor, UpdateDoctor $action): RedirectResponse
    {
        $result = $action->handle($doctor, $request->validated());

        if ($result['credentials'] !== null) {
            Inertia::flash('credentials', $result['credentials']);
        }

        Toast::success('Doctor actualizado correctamente.');

        return redirect()->route('doctores');
    }

    public function resetDoctorPassword(Doctor $doctor, ResetDoctorPassword $action): RedirectResponse
    {
        // Authorization handled by route middleware (permission:module.doctores.access)

        $credentials = $action->handle($doctor);

        Inertia::flash('credentials', $credentials);

        Toast::success('Contraseña restablecida correctamente.');

        return redirect()->route('doctores');
    }

    public function toggleDoctor(Doctor $doctor): RedirectResponse
    {
        // Prevent deactivating your own doctor record
        if (Auth::id() === $doctor->user_id) {
            Toast::error('No puedes desactivar tu propio registro de médico.');

            return redirect()->route('doctores');
        }

        $newStatus = ! $doctor->is_active;

        $doctor->update(['is_active' => $newStatus]);

        // Sync linked user only when their sole role is 'medico'
        if ($doctor->user !== null) {
            $roles = $doctor->user->getRoleNames();
            $soleRole = $roles->count() === 1 && $roles->first() === 'medico';
            if ($soleRole) {
                $doctor->user->update(['is_active' => $newStatus]);
            }
        }

        Toast::success('Estado del doctor actualizado.');

        return redirect()->route('doctores');
    }
}
