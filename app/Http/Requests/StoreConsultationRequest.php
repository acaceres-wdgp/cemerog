<?php

namespace App\Http\Requests;

use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class StoreConsultationRequest extends FormRequest
{
    /**
     * Authorize the request.
     *
     * The authenticated user must:
     *   - have an active linked doctor
     *   - supply a turn_id that exists and belongs to today
     *   - own that turn (turn->doctor_id === auth user's doctor id)
     *   - have the turn in a status that allows recording (espera or en_consulta)
     */
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();

        if ($user->doctor === null || ! $user->doctor->is_active) {
            return false;
        }

        $turnId = $this->input('turn_id');

        if (! $turnId) {
            return false;
        }

        $turn = Turn::find($turnId);

        if ($turn === null) {
            return false;
        }

        // Turn must be from today and in an open status (espera or en_consulta)
        if (! $turn->isOpenToday()) {
            return false;
        }

        // Turn must belong to the authenticated doctor
        return $turn->doctor_id === $user->doctor->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // turn_id is required; doctor_id and patient_id are derived from it in the controller
            'turn_id' => ['required', 'integer', 'exists:turns,id'],
            // doctor_id / patient_id may arrive from the frontend but are ignored; kept for backward-compat validation only
            'doctor_id' => ['nullable', 'integer', 'exists:doctors,id'],
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'peso' => ['nullable', 'integer', 'min:0'],
            'talla' => ['nullable', 'integer', 'min:0'],
            'temp' => ['nullable', 'integer', 'min:0'],
            'presion_arterial' => ['nullable', 'string', 'max:20'],
            'frecuencia_cardiaca' => ['nullable', 'integer', 'min:0'],
            'frecuencia_respiratoria' => ['nullable', 'integer', 'min:0'],
            'saturacion_o2' => ['nullable', 'integer', 'min:0', 'max:100'],
            'glucemia' => ['nullable', 'integer', 'min:0'],
            'motivo_consulta' => ['nullable', 'string'],
            'historia_enfermedad' => ['nullable', 'string'],
            'examen_fisico' => ['nullable', 'string'],
            'diagnosticos' => ['nullable', 'array'],
            'diagnosticos.*.code' => ['required_with:diagnosticos', 'string', 'max:20'],
            'diagnosticos.*.label' => ['required_with:diagnosticos', 'string', 'max:255'],
            'plan_tratamiento' => ['nullable', 'string'],
        ];
    }
}
