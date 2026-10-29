<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate middleware for the /consulta route group.
 *
 * Requirements (both must be true):
 *   1. The user has the module.consulta.access permission.
 *   2. The user has a linked doctor record that is currently active.
 *
 * An administrator without a linked doctor cannot enter Consulta.
 * The owner (roles administrador + medico, linked to an active doctor) can.
 */
class AttendPatients
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if (
            $user === null
            || ! $user->hasPermissionTo('module.consulta.access')
            || $user->doctor === null
            || ! $user->doctor->is_active
        ) {
            abort(403);
        }

        return $next($request);
    }
}
