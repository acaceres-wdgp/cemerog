<?php

namespace App\Http\Controllers\Auth;

use App\Actions\ResolveHomeRoute;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Only temporary passwords are changed here; the administrator manages
 * every other password change.
 */
class ChangePasswordController extends Controller
{
    /**
     * Show the change password form (required on first login).
     */
    public function create(ResolveHomeRoute $resolveHomeRoute): Response|RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (! $user->must_change_password) {
            return redirect($resolveHomeRoute->handle($user));
        }

        return Inertia::render('auth/change-password');
    }

    /**
     * Update the user's temporary password.
     */
    public function store(Request $request, ResolveHomeRoute $resolveHomeRoute): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if (! $user->must_change_password) {
            return redirect($resolveHomeRoute->handle($user));
        }

        $request->validate([
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->numbers(),
            ],
        ]);

        $user->update([
            'password' => Hash::make($request->string('password')),
            'must_change_password' => false,
        ]);

        return redirect($resolveHomeRoute->handle($user));
    }
}
