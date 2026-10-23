<?php

namespace App\Actions;

use App\Models\User;

class ResolveHomeRoute
{
    /**
     * Module keys in sidebar order (keep in sync with resources/js/lib/navigation.ts).
     * Each key is both the route name and the `module.<key>.access` permission.
     *
     * @var list<string>
     */
    private const MODULES = [
        'inicio',
        'tablero', 'registro', 'citas',
        'consulta', 'emergencia', 'internamiento', 'cirugia',
        'lab', 'img', 'impresos',
        'caja', 'cxc', 'cuadre',
        'almacen', 'entrada',
        'admin', 'doctores', 'analisis', 'imgcat', 'precios', 'habs', 'tema',
    ];

    /**
     * Get the URL of the first module the user can access.
     * Users without any module land on their profile settings.
     */
    public function handle(User $user): string
    {
        $permissions = $user->getAllPermissions()->pluck('name');

        foreach (self::MODULES as $module) {
            if ($permissions->contains("module.{$module}.access")) {
                return route($module, absolute: false);
            }
        }

        return route('profile.edit', absolute: false);
    }
}
