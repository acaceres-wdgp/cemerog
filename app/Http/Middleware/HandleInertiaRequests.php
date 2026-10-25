<?php

namespace App\Http\Middleware;

use App\Models\Turn;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $user->getRoleNames()->toArray(),
                ]) : null,
            ],
            'permissions' => $user
                ? $user->getAllPermissions()->pluck('name')->toArray()
                : [],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') !== 'collapsed',
            'doctor' => fn () => $user?->doctor
                ? [
                    'id' => $user->doctor->id,
                    'name' => $user->doctor->name,
                    'office' => $user->doctor->office,
                ]
                : null,
            'queue' => $user?->doctor !== null
                ? Inertia::defer(fn () => $this->resolveQueue($user))
                : null,
        ];
    }

    /**
     * Resolve the current doctor's queue for the sidebar "Turno actual" card.
     * Returns null when the user has no linked doctor.
     *
     * @return array{current_turn: array{id:int,turn_number:int,patient_name:string}|null, waiting_count: int}|null
     */
    private function resolveQueue(?User $user): ?array
    {
        if ($user === null || $user->doctor === null) {
            return null;
        }

        $doctorId = $user->doctor->id;
        $today = Carbon::today();

        $currentTurn = Turn::with('patient')
            ->where('doctor_id', $doctorId)
            ->where('status', 'en_consulta')
            ->whereDate('created_at', $today)
            ->first();

        $waitingCount = Turn::where('doctor_id', $doctorId)
            ->where('status', 'espera')
            ->whereDate('created_at', $today)
            ->count();

        return [
            'current_turn' => $currentTurn ? [
                'id' => $currentTurn->id,
                'turn_number' => $currentTurn->turn_number,
                'patient_name' => trim(
                    $currentTurn->patient->first_names.' '.$currentTurn->patient->last_names
                ),
            ] : null,
            'waiting_count' => $waitingCount,
        ];
    }
}
