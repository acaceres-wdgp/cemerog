<?php

namespace App\Http\Requests;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Programar / reprogramar: doctors and the administrator */
class SurgeryRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $user */
        $user = $this->user();

        return self::canSchedule($user);
    }

    public static function canSchedule(User $user): bool
    {
        return $user->can('module.cirugia.access') && ($user->canAttendPatients() || $user->hasRole('administrador'));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $creating = $this->route('surgery') === null;

        return [
            'patient_id' => [$creating ? 'required' : 'prohibited', 'integer', 'exists:patients,id'],
            'surgery_procedure_id' => [$creating ? 'required' : 'prohibited', 'integer', Rule::exists('surgery_procedures', 'id')->where('is_active', true)],
            'surgeon_id' => [$creating ? 'required' : 'prohibited', 'integer', 'exists:doctors,id'],
            'anesthetist_id' => ['nullable', 'integer', 'exists:doctors,id', 'different:surgeon_id'],
            'operating_room_id' => ['required', 'integer', 'exists:operating_rooms,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:720'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'Busca y elige al paciente.',
            'surgery_procedure_id.required' => 'Elige el procedimiento.',
            'surgeon_id.required' => 'Elige el cirujano.',
            'anesthetist_id.different' => 'El anestesiólogo no puede ser el mismo cirujano.',
        ];
    }

    public function startsAt(): CarbonImmutable
    {
        return CarbonImmutable::createFromFormat('Y-m-d H:i', $this->validated('date').' '.$this->validated('time'));
    }

    public function endsAt(): CarbonImmutable
    {
        return $this->startsAt()->addMinutes((int) $this->validated('duration_minutes'));
    }
}
