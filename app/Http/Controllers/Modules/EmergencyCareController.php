<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Emergencia\ApplyToEmergency;
use App\Actions\Emergencia\DischargeEmergency;
use App\Actions\Emergencia\EnsureEmergencyActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\DischargeEmergencyRequest;
use App\Http\Requests\EmergencyApplicationRequest;
use App\Http\Requests\EmergencyVitalRequest;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\EmergencyVital;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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

    public function discharge(DischargeEmergencyRequest $request, Emergency $emergency, DischargeEmergency $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var array{type: string, destination?: string|null, reason?: string|null, discharge_diagnosis: string} $data */
        $data = $request->validated();

        // The doctor who signs it; an administrator signs for the emergency's doctor
        $doctorId = $user->canAttendPatients() ? (int) $user->doctor?->id : $emergency->doctor_id;

        $action->handle($emergency, $user, $doctorId, $data);

        Toast::success("Alta de {$emergency->patient->full_name}. La cuenta pasa a Facturación.");

        return redirect()->route('emergencia');
    }

    /** Move the patient to another free cubicle */
    public function moveCubicle(Request $request, Emergency $emergency): RedirectResponse
    {
        abort_unless($request->user()?->can('module.emergencia.access'), 403);
        $cubicleId = (int) $request->validate(['cubicle_id' => ['required', 'integer']])['cubicle_id'];

        DB::transaction(function () use ($emergency, $cubicleId): void {
            EnsureEmergencyActive::check($emergency);
            $cubicle = EmergencyCubicle::whereKey($cubicleId)->lockForUpdate()->first();
            $taken = Emergency::where('occupied_cubicle_id', $cubicleId)->where('id', '!=', $emergency->id)->exists();
            if ($cubicle === null || ! $cubicle->is_active || $taken) {
                throw ValidationException::withMessages(['cubicle_id' => 'Ese cubículo no está libre. Elige otro.']);
            }
            $emergency->update(['cubicle_id' => $cubicle->id, 'occupied_cubicle_id' => $cubicle->id]);
        });

        Toast::success('Paciente movido a '.EmergencyCubicle::find($cubicleId)?->name.'.');

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
