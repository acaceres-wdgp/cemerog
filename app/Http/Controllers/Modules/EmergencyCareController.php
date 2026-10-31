<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Emergencia\ApplyToEmergency;
use App\Actions\Emergencia\EnsureEmergencyActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\EmergencyApplicationRequest;
use App\Http\Requests\EmergencyVitalRequest;
use App\Models\Emergency;
use App\Models\EmergencyVital;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/** What happens to the patient while in emergency */
class EmergencyCareController extends Controller
{
    public function storeVitals(EmergencyVitalRequest $request, Emergency $emergency): RedirectResponse
    {
        EnsureEmergencyActive::check($emergency);
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        EmergencyVital::create([
            ...$data,
            'emergency_id' => $emergency->id,
            'temp' => (int) round(((float) $data['temp']) * 10),
            'taken_at' => now(),
            'taken_by' => $user->id,
        ]);

        Toast::success('Toma de signos vitales registrada.');

        return back();
    }

    public function storeApplication(EmergencyApplicationRequest $request, Emergency $emergency, ApplyToEmergency $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();
        $kind = (string) $data['kind'];
        $brought = $kind === 'medicamento' && $request->boolean('brought_by_patient');

        $application = $action->handle(
            $emergency,
            $user,
            $kind,
            $brought ? null : (int) $data['inventory_item_id'],
            $brought ? (string) $data['description'] : null,
            (int) $data['quantity'],
            $kind === 'medicamento' ? ($data['route'] ?? null) : null,
        );

        Toast::success($brought
            ? "{$application->description} registrado (traído por el paciente, sin cargo)."
            : "{$application->description} × {$application->quantity} aplicado y cargado a la cuenta.");

        return back();
    }
}
