<?php

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

/*
 * The prescription belongs to the consultation of its turn whatever the order
 * the doctor saves them in. Saved before the note, it used to stay without a
 * consultation: the patient profile then lost its diagnosis.
 */
const LINK_MIGRATION = 'migrations/2026_11_20_100000_link_prescriptions_to_consultations.php';

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->user->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'specialty_id' => Specialty::factory()->create()->id,
        'user_id' => $this->user->id,
        'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create(['allergies' => null]);
    $this->turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);
});

function savePrescription(object $test): void
{
    $test->actingAs($test->user)
        ->post("/consulta/turnos/{$test->turn->id}/receta", [
            'items' => [[
                'position' => 1, 'medication' => 'Amoxicilina 500 mg', 'dose' => '1 cápsula',
                'frequency' => 'Cada 8 horas', 'duration_days' => 7, 'is_continuous' => false, 'quantity' => 21,
            ]],
        ])
        ->assertSessionHasNoErrors();
}

function saveNote(object $test, string $motivo = 'Dolor de garganta'): void
{
    $test->actingAs($test->user)
        ->post('/consulta', [
            'turn_id' => $test->turn->id,
            'motivo_consulta' => $motivo,
            'diagnosticos' => [['code' => 'J02.9', 'label' => 'Faringitis aguda']],
        ])
        ->assertSessionHasNoErrors();
}

test('a prescription saved before the note joins the note when it is saved', function () {
    savePrescription($this);
    expect(Prescription::firstOrFail()->consultation_id)->toBeNull();

    saveNote($this);

    expect(Prescription::firstOrFail()->consultation_id)->toBe(Consultation::firstOrFail()->id);
});

test('a prescription saved after the note still joins it', function () {
    saveNote($this);
    savePrescription($this);

    expect(Prescription::firstOrFail()->consultation_id)->toBe(Consultation::firstOrFail()->id);
});

test('a second note does not move the prescription away from the first', function () {
    savePrescription($this);
    saveNote($this, 'Primera');
    $first = Consultation::firstOrFail()->id;

    saveNote($this, 'Segunda');

    expect(Prescription::firstOrFail()->consultation_id)->toBe($first);
});

test('the patient profile shows the diagnosis of a prescription saved before the note', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo('module.pacientes.access');
    savePrescription($this);
    saveNote($this);

    $this->actingAs($admin)
        ->get("/pacientes/{$this->patient->id}")
        ->assertInertia(fn ($page) => $page->where('recetas.0.diagnostico', 'Faringitis aguda')->etc());
});

test('the migration joins the prescriptions left without their consultation', function () {
    $consultation = Consultation::create([
        'turn_id' => $this->turn->id, 'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id, 'created_by' => $this->user->id, 'motivo_consulta' => 'Control',
    ]);
    $loose = Prescription::create([
        'turn_id' => $this->turn->id, 'patient_id' => $this->patient->id, 'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id, 'prescribed_at' => now(),
    ]);
    // A prescription whose turn has no note stays as it is
    $otherTurn = Turn::factory()->create(['doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id, 'arrived_at' => now()]);
    $alone = Prescription::create([
        'turn_id' => $otherTurn->id, 'patient_id' => $this->patient->id, 'doctor_id' => $this->doctor->id,
        'created_by' => $this->user->id, 'prescribed_at' => now(),
    ]);

    $migration = include database_path(LINK_MIGRATION);
    $migration->up();

    expect($loose->fresh()->consultation_id)->toBe($consultation->id)
        ->and($alone->fresh()->consultation_id)->toBeNull();

    // Rolling back keeps the links: they are correct data, not something to undo
    $migration->down();
    expect($loose->fresh()->consultation_id)->toBe($consultation->id);
});
