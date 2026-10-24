<?php

namespace App\Exceptions;

use App\Models\Patient;
use App\Models\Turn;
use RuntimeException;

class PatientHasOpenTurnException extends RuntimeException
{
    public function __construct(
        public readonly Patient $patient,
        public readonly Turn $openTurn,
    ) {
        parent::__construct(
            "El paciente ya tiene la atención A-{$openTurn->id} abierta hoy ({$openTurn->status})."
        );
    }
}
