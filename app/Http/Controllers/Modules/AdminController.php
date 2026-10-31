<?php

namespace App\Http\Controllers\Modules;

use App\Actions\CreateUser;
use App\Actions\UpdateUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\ChangeUserPasswordRequest;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminController extends Controller
{
    private const ROLE_LABELS = [
        'administrador' => 'Administrador',
        'medico' => 'Médico',
        'enfermeria' => 'Enfermería',
        'secretaria' => 'Secretaria',
        'bioanalista' => 'Bioanálisis',
        'imagenes' => 'Imágenes',
        'caja' => 'Caja',
        'almacen' => 'Almacén',
    ];

    private const PERMISSION_LABELS = [
        'inicio' => 'Inicio',
        'tablero' => 'Tablero',
        'registro' => 'Registro de pacientes',
        'citas' => 'Citas',
        'consulta' => 'Consultas',
        'emergencia' => 'Emergencia',
        'internamiento' => 'Internamiento',
        'cirugia' => 'Cirugía',
        'lab' => 'Laboratorio',
        'img' => 'Imágenes médicas',
        'impresos' => 'Impresos',
        'caja' => 'Facturación',
        'cxc' => 'Cuentas por cobrar',
        'cuadre' => 'Cuadre de caja',
        'almacen' => 'Almacén',
        'entrada' => 'Entrada de mercancía',
        'admin' => 'Administración',
        'doctores' => 'Doctores',
        'analisis' => 'Tipos de análisis',
        'imgcat' => 'Catálogo de imágenes',
        'precios' => 'Precios',
        'habs' => 'Habitaciones',
        'tema' => 'Tema',
    ];

    public function index(): Response
    {
        // Get last_activity per user from sessions table
        $lastActivities = DB::table('sessions')
            ->select('user_id', DB::raw('MAX(last_activity) as last_activity'))
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->pluck('last_activity', 'user_id');

        $users = User::with(['roles', 'permissions'])->get()->map(function (User $user) use ($lastActivities) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'roles' => $user->roles->pluck('name')->all(),
                'permissions' => $user->permissions->pluck('name')->all(),
                'all_permissions' => $user->getAllPermissions()->pluck('name')->all(),
                'last_activity' => $lastActivities[$user->id] ?? null,
            ];
        });

        $roles = Role::with('permissions')->get()->map(function (Role $role) {
            return [
                'name' => $role->name,
                'label' => self::ROLE_LABELS[$role->name] ?? $role->name,
                'permissions' => $role->permissions->pluck('name')->all(),
            ];
        });

        $permissions = Permission::all()->map(function (Permission $permission) {
            // Extract module key from "module.<key>.access"
            $parts = explode('.', $permission->name);
            $moduleKey = $parts[1] ?? $permission->name;

            return [
                'name' => $permission->name,
                'label' => self::PERMISSION_LABELS[$moduleKey] ?? $moduleKey,
                'module' => $moduleKey,
            ];
        });

        return Inertia::render('admin/index', [
            'users' => $users,
            'roles' => $roles,
            // Not `permissions`: that is the shared prop with the user's own permissions
            'available_permissions' => $permissions,
        ]);
    }

    public function store(StoreUserRequest $request, CreateUser $createUser): RedirectResponse
    {
        $createUser->handle($request->validated());

        Toast::success('Usuario creado exitosamente.');

        return redirect()->route('admin');
    }

    public function update(UpdateUserRequest $request, User $user, UpdateUser $updateUser): RedirectResponse
    {
        $updateUser->handle($user, $request->validated());

        Toast::success('Usuario actualizado exitosamente.');

        return redirect()->route('admin');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        $user->update(['is_active' => ! $user->is_active]);

        $status = $user->is_active ? 'activado' : 'desactivado';

        Toast::success("Usuario {$status} exitosamente.");

        return redirect()->route('admin');
    }

    public function changePassword(ChangeUserPasswordRequest $request, User $user): RedirectResponse
    {
        $user->update([
            'password' => $request->validated('password'),
            'must_change_password' => (bool) $request->validated('must_change_password', false),
        ]);

        Toast::success('Contraseña actualizada exitosamente.');

        return redirect()->route('admin');
    }
}
