<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Emergencia\EnsureEmergencyActive;
use App\Actions\OrderStudies;
use App\Http\Controllers\Controller;
use App\Http\Requests\StudyOrderRequest;
use App\Models\Admission;
use App\Models\Emergency;
use App\Models\Turn;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

/** «Ordenar estudios» (laboratory and imaging) from Consulta and Emergencia */
class StudyOrderController extends Controller
{
    public function storeFromTurn(StudyOrderRequest $request, Turn $turn, OrderStudies $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $numbers = $action->handle($turn->patient, 'consulta', [
            'turn_id' => $turn->id,
            'doctor_id' => $turn->doctor_id,
        ], $request->testIds(), $request->studyIds(), $request->validated('indication'), $user);

        Toast::success(OrderStudies::message($numbers));

        return back();
    }

    public function storeFromAdmission(StudyOrderRequest $request, Admission $admission, OrderStudies $action): RedirectResponse
    {
        if (! $admission->isActive()) {
            return back()->withErrors(['admission' => 'El paciente ya fue dado de alta.']);
        }
        /** @var User $user */
        $user = $request->user();

        // Charged when done, to the account of the stay (GetOrOpenDailyAccount)
        $numbers = $action->handle($admission->patient, 'internamiento', [
            'doctor_id' => $admission->doctor_id,
        ], $request->testIds(), $request->studyIds(), $request->validated('indication'), $user);

        Toast::success(OrderStudies::message($numbers));

        return back();
    }

    public function storeFromEmergency(StudyOrderRequest $request, Emergency $emergency, OrderStudies $action): RedirectResponse
    {
        EnsureEmergencyActive::check($emergency);
        /** @var User $user */
        $user = $request->user();

        $numbers = $action->handle($emergency->patient, 'emergencia', [
            'emergency_id' => $emergency->id,
            'doctor_id' => $emergency->doctor_id,
        ], $request->testIds(), $request->studyIds(), $request->validated('indication'), $user);

        Toast::success(OrderStudies::message($numbers));

        return back();
    }
}
