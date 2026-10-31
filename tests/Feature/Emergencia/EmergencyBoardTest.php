<?php

use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;

beforeEach(function () {
    $this->enfermera = User::factory()->create();
    $this->enfermera->assignRole('enfermeria');
    $this->doctor = Doctor::factory()->create([
        'name' => 'Dr. Franklin Rodríguez',
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
});

function admit(User $by, Patient $patient, string $cubicle, string $reason = 'Fiebre.'): Emergency
{
    test()->actingAs($by)->post('/emergencia/ingreso', [
        'patient_id' => $patient->id,
        'cubicle_id' => EmergencyCubicle::where('name', $cubicle)->value('id'),
        'doctor_id' => Doctor::value('id'),
        'reason' => $reason,
    ])->assertSessionHasNoErrors();

    return Emergency::latest('id')->first();
}

test('the board lists the patients in emergency and the cubicle map', function () {
    $ana = Patient::factory()->create(['first_names' => 'Ana', 'last_names' => 'Torres', 'sex' => 'F']);
    $luis = Patient::factory()->create(['first_names' => 'Luis', 'last_names' => 'Gómez']);
    $first = admit($this->enfermera, $ana, 'Cub. 2', 'Dolor torácico.');
    $first->update(['arrived_at' => now()->subMinutes(40)]);
    admit($this->enfermera, $luis, 'Observación');

    $this->actingAs($this->enfermera)
        ->get('/emergencia')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('emergencia/index')
            ->has('emergencies', 2)
            ->where('emergencies.0.id', $first->id)
            ->where('emergencies.0.patient.full_name', 'Ana Torres')
            ->where('emergencies.0.patient.sex', 'F')
            ->where('emergencies.0.patient.profile_incomplete', false)
            ->where('emergencies.0.cubicle', ['id' => $first->cubicle_id, 'name' => 'Cub. 2'])
            ->where('emergencies.0.doctor', 'Dr. Franklin Rodríguez')
            ->where('emergencies.0.reason', 'Dolor torácico.')
            ->has('emergencies.0.arrived_at')
            ->has('cubicles', 7)
            ->where('cubicles.1.name', 'Cub. 2')
            ->where('cubicles.1.emergency_id', $first->id)
            ->where('cubicles.1.patient', 'Ana')
            ->where('cubicles.0.emergency_id', null)
        );
});

test('the detail shows the patient, the cubicle and the account of the attention', function () {
    $patient = Patient::factory()->create(['first_names' => 'Ana', 'last_names' => 'Torres', 'allergies' => 'Penicilina']);
    $emergency = admit($this->enfermera, $patient, 'Cub. 3', 'Dolor torácico.');

    $this->actingAs($this->enfermera)
        ->get("/emergencia/{$emergency->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('emergencia/show')
            ->where('emergency.number', $emergency->number)
            ->where('emergency.status', 'activa')
            ->where('emergency.cubicle.name', 'Cub. 3')
            ->where('emergency.doctor', 'Dr. Franklin Rodríguez')
            ->where('emergency.patient.full_name', 'Ana Torres')
            ->where('emergency.patient.allergies', 'Penicilina')
            ->where('emergency.account.total', 150000)
            ->where('emergency.account.charges_count', 1)
        );
});

test('only clinical staff see the emergency board', function () {
    $secretaria = User::factory()->create();
    $secretaria->assignRole('secretaria');

    $this->actingAs($secretaria)->get('/emergencia')->assertForbidden();
});
