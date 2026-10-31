<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmergencyCubicleRequest;
use App\Models\EmergencyCubicle;
use App\Models\Setting;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Administración › Emergencia: cubicles and the emergency fee */
class EmergencyConfigController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin-emergencia/index', [
            'cubicles' => EmergencyCubicle::orderBy('position')->get()
                ->map(fn (EmergencyCubicle $c): array => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'is_active' => $c->is_active,
                ])->all(),
            'emergency_fee' => Setting::emergencyFee(),
        ]);
    }

    public function storeCubicle(EmergencyCubicleRequest $request): RedirectResponse
    {
        EmergencyCubicle::create([
            'name' => trim((string) $request->validated('name')),
            'position' => (int) EmergencyCubicle::max('position') + 1,
            'is_active' => true,
        ]);

        Toast::success('Cubículo agregado.');

        return back();
    }

    public function updateCubicle(EmergencyCubicleRequest $request, EmergencyCubicle $cubicle): RedirectResponse
    {
        $data = $request->validated();
        $cubicle->update([
            'name' => trim((string) $data['name']),
            'is_active' => (bool) ($data['is_active'] ?? $cubicle->is_active),
        ]);

        Toast::success('Cubículo actualizado.');

        return back();
    }

    public function updateFee(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->hasRole('administrador'), 403);

        $data = $request->validate(
            ['emergency_fee' => ['required', 'integer', 'min:0', 'max:100000000']],
            ['emergency_fee.min' => 'El cargo no puede ser negativo.'],
        );

        Setting::put('emergency_fee', (string) $data['emergency_fee']);

        Toast::success('Cargo de emergencia actualizado.');

        return back();
    }
}
