<?php

use App\Actions\Emergencia\AdmitToEmergency;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\Patient;
use App\Models\Setting;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->assignRole('secretaria');
    $this->doctor = Doctor::factory()->create([
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->cub3 = EmergencyCubicle::where('name', 'Cub. 3')->first();
});

function emergencyArrival(array $overrides = []): array
{
    return [
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
        'first_names' => 'José Ramón',
        'last_names' => 'Tavárez Cruz',
        'birth_date' => '1980-03-10',
        'sex' => 'M',
        'phone' => '809-555-0001',
        'attention_type' => 'emergencia',
        'doctor_id' => Doctor::value('id'),
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 3')->value('id'),
        'notes' => 'Dolor torácico opresivo de 30 minutos.',
        ...$overrides,
    ];
}

test('registro offers the free cubicles and the emergency fee', function () {
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');
    app(AdmitToEmergency::class)->handle(Patient::factory()->create(), null, $this->cub3->id, $this->doctor->id, 'x', $enfermera);

    $this->actingAs($this->secretaria)
        ->get('/registro')
        ->assertInertia(fn (Assert $page) => $page
            ->where('emergencyFee', Setting::emergencyFee())
            ->where('emergencyCubicles', fn ($c) => collect($c)->pluck('id')->doesntContain($this->cub3->id)
                && collect($c)->count() === EmergencyCubicle::active()->count() - 1)
        );
});

test('a patient registered as emergency goes to a cubicle with the fee charged, without a turn', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', emergencyArrival())
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success');

    $patient = Patient::where('first_names', 'José Ramón')->firstOrFail();
    $emergency = Emergency::firstOrFail();
    expect($emergency->patient_id)->toBe($patient->id)
        ->and($emergency->occupied_cubicle_id)->toBe($this->cub3->id)
        ->and($emergency->doctor_id)->toBe($this->doctor->id)
        ->and($emergency->reason)->toBe('Dolor torácico opresivo de 30 minutos.')
        ->and($patient->profile_incomplete)->toBeFalse()
        ->and(Turn::count())->toBe(0)
        ->and(AccountCharge::where('type', 'emergencia')->value('total'))->toBe(Setting::emergencyFee());
});

test('it goes to the emergency file when the user can see it; otherwise to the board', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', emergencyArrival())
        ->assertRedirect('/tablero');

    $admin = User::factory()->create();
    $admin->assignRole('administrador');
    $patient = Patient::factory()->create();
    $this->actingAs($admin)
        ->post('/registro', emergencyArrival([
            'patient_id' => $patient->id,
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 4')->value('id'),
        ]))
        ->assertRedirect('/emergencia/'.Emergency::where('patient_id', $patient->id)->value('id'));
});

test('emergency needs doctor, a free cubicle and the reason', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', emergencyArrival(['doctor_id' => null, 'cubicle_id' => null, 'notes' => '']))
        ->assertSessionHasErrors(['doctor_id', 'cubicle_id', 'notes']);

    $this->actingAs($this->secretaria)->post('/registro', emergencyArrival());
    $this->actingAs($this->secretaria)
        ->post('/registro', emergencyArrival(['document_number' => '001-7654321-0', 'first_names' => 'Ana']))
        ->assertSessionHasErrors(['cubicle_id']);

    expect(Emergency::count())->toBe(1)
        ->and(Patient::where('first_names', 'Ana')->exists())->toBeFalse();
});
