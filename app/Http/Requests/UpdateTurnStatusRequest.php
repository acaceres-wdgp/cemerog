<?php

namespace App\Http\Requests;

use App\Models\Turn;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateTurnStatusRequest extends FormRequest
{
    /** @var array<string, list<string>> */
    private const ALLOWED_FROM = [
        'espera' => ['en_consulta', 'no_asistio'],
        'en_consulta' => ['espera'],
    ];

    public function authorize(): bool
    {
        return $this->user()->can('module.tablero.access');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['espera', 'en_consulta', 'no_asistio'])],
        ];
    }

    /**
     * A turn only reaches `atendido` through the discharge in Consulta, and
     * `no_asistio` removes the consultation charge, so the Tablero may only
     * call a waiting patient, send them back to the queue, or mark them absent.
     *
     * @return array<int, \Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var Turn $turn */
                $turn = $this->route('turn');
                $to = $this->input('status');

                if (! in_array($to, self::ALLOWED_FROM[$turn->status] ?? [], true)) {
                    $validator->errors()->add('status', 'Este cambio de estado no está permitido desde el Tablero.');
                }
            },
        ];
    }
}
