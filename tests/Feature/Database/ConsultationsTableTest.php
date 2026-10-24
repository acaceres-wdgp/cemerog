<?php

use App\Models\Consultation;
use App\Models\Turn;
use Illuminate\Database\QueryException;

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

test('rolling back restores the original turn_id foreign key', function () {
    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_24_000000_fix_consultations_turn_id_foreign_key.php',
    ])->assertSuccessful();

    $turn = Turn::factory()->create();
    Consultation::factory()->create([
        'patient_id' => $turn->patient_id,
        'doctor_id' => $turn->doctor_id,
        'turn_id' => $turn->id,
    ]);

    expect(fn () => $turn->delete())->toThrow(QueryException::class);

    $this->artisan('migrate')->assertSuccessful();
});
