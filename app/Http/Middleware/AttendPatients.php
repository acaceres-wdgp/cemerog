<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate middleware for the /consulta route group.
 *
 * Requirements:
 *   1. The user has the module.consulta.access permission (required for ALL methods).
 *   2. For write methods (POST/PATCH), the user must also have an active linked doctor.
 *      For GET, a user with the permission but no active doctor gets a 200 empty-state
 *      response (can_attend: false) — the controller handles the prop.
 */
class AttendPatients
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user === null || ! $user->hasPermissionTo('module.consulta.access')) {
            abort(403);
        }

        // Write routes require an active linked doctor
        if (! $request->isMethod('GET') && ! $user->canAttendPatients()) {
            abort(403);
        }

        return $next($request);
    }
}
