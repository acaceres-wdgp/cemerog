<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateAppointmentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('module.citas.access') ?? false;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            // Cancelling has its own route (DELETE /citas/{appointment})
            'status' => ['required', 'in:pendiente,confirmada,no_asistio'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'status.required' => 'El estado es obligatorio.',
            'status.in' => 'El estado seleccionado no es válido.',
        ];
    }

    /**
     * A patient who already has a turn did show up, and one whose appointment
     * hasn't arrived yet can't have missed it.
     *
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->input('status') !== 'no_asistio') {
                    return;
                }

                /** @var Appointment $appointment */
                $appointment = $this->route('appointment');

                if ($appointment->turn()->exists()) {
                    $validator->errors()->add('status', 'El paciente ya tiene un turno asignado para esta cita.');
                } elseif ($appointment->appointment_date->isAfter(today())) {
                    $validator->errors()->add('status', 'No se puede marcar como «No asistió» una cita futura.');
                }
            },
        ];
    }
}
