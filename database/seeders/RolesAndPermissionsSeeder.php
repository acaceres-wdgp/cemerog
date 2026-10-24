<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Module keys and the roles that can access them.
     *
     * @var array<string, array<string>>
     */
    private const ROLE_MODULES = [
        'administrador' => [
            'inicio', 'tablero', 'pacientes', 'registro', 'citas', 'consulta', 'emergencia',
            'internamiento', 'cirugia', 'lab', 'img', 'impresos',
            'caja', 'cxc', 'cuadre', 'almacen', 'entrada',
            'admin', 'doctores', 'analisis', 'imgcat', 'precios', 'habs', 'tema',
        ],
        'medico' => [
            'inicio', 'tablero', 'pacientes', 'citas', 'consulta', 'emergencia',
            'internamiento', 'cirugia', 'lab', 'img', 'impresos',
        ],
        'enfermeria' => [
            'tablero', 'emergencia', 'internamiento', 'cirugia', 'impresos',
        ],
        'secretaria' => [
            'inicio', 'tablero', 'pacientes', 'registro', 'citas', 'impresos',
        ],
        'bioanalista' => [
            'lab', 'impresos',
        ],
        'imagenes' => [
            'img',
        ],
        'caja' => [
            'inicio', 'tablero', 'caja', 'cxc', 'cuadre', 'impresos',
        ],
        'almacen' => [
            'almacen', 'entrada',
        ],
    ];

    /**
     * Run the database seeds (idempotent).
     */
    public function run(): void
    {
        // Collect all unique module keys
        $allModules = collect(self::ROLE_MODULES)
            ->flatten()
            ->unique()
            ->values();

        // Create permissions
        foreach ($allModules as $module) {
            Permission::firstOrCreate(['name' => "module.{$module}.access", 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        foreach (self::ROLE_MODULES as $roleName => $modules) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

            $permissions = collect($modules)->map(fn ($m) => "module.{$m}.access");
            $role->syncPermissions($permissions->toArray());
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
