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
        $doctorName = $openTurn->relationLoaded('doctor')
            ? $openTurn->doctor->name
            : $openTurn->doctor()->value('name') ?? 'desconocido';

        parent::__construct(
            "El paciente ya tiene un turno abierto hoy con Dr. {$doctorName} (A-{$openTurn->id}, {$openTurn->status})."
        );
    }
}
