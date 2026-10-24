<?php

use App\Models\Consultation;
use App\Models\Turn;

test('deleting a turn keeps its consultation and clears turn_id', function () {
    $turn = Turn::factory()->create();
    $consultation = Consultation::factory()->create([
        'patient_id' => $turn->patient_id,
        'doctor_id' => $turn->doctor_id,
        'turn_id' => $turn->id,
    ]);

    $turn->delete();

    expect($consultation->fresh())->not->toBeNull()
        ->and($consultation->fresh()->turn_id)->toBeNull();
});
