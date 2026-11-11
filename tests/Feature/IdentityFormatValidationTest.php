<?php

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;

/**
 * Every form that takes a cédula, a phone or an RNC rejects incomplete values,
 * not only the patient's: the mask in the browser does not stop a short one.
 */
const CEDULA_MSG = 'La cédula debe tener 11 dígitos (000-0000000-0).';
const PHONE_MSG = 'El teléfono debe tener 10 dígitos y empezar por 809, 829 u 849.';

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');
    $this->doctor = Doctor::factory()->create(['specialty_id' => Specialty::factory()->create()->id, 'is_active' => true]);
});

function patientPayload(array $overrides = []): array
{
    return [
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
        'first_names' => 'María',
        'last_names' => 'Pérez',
        'birth_date' => '1990-05-15',
        'sex' => 'F',
        'phone' => '(809) 555-1234',
        'emergency_contact_phone' => '(809) 555-5678',
        ...$overrides,
    ];
}

$incomplete = ['document_number' => '001', 'phone' => '809', 'emergency_contact_phone' => '829-55'];
$messages = ['document_number' => CEDULA_MSG, 'phone' => PHONE_MSG, 'emergency_contact_phone' => PHONE_MSG];

test('registering a patient rejects an incomplete cédula and phones', function () use ($incomplete, $messages) {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', patientPayload($incomplete))
        ->assertSessionHasErrors($messages);

    expect(Patient::count())->toBe(0);
});

test('registering an arrival rejects an incomplete cédula and phones', function () use ($incomplete, $messages) {
    $this->actingAs($this->secretaria)
        ->post('/registro', patientPayload([...$incomplete, 'attention_type' => 'consulta', 'doctor_id' => $this->doctor->id]))
        ->assertSessionHasErrors($messages);

    expect(Patient::count())->toBe(0);
});

test('editing a patient rejects an incomplete cédula and phones', function () use ($incomplete, $messages) {
    $this->actingAs($this->secretaria)->post('/registro/pacientes', patientPayload());
    $patient = Patient::firstOrFail();

    $this->actingAs($this->secretaria)
        ->put("/registro/pacientes/{$patient->id}", patientPayload($incomplete))
        ->assertSessionHasErrors($messages);

    expect($patient->fresh()->phone)->toBe('(809) 555-1234');
});

test('complete values with the mask are accepted', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', patientPayload())
        ->assertSessionHasNoErrors();

    expect(Patient::count())->toBe(1);
});

test('a passport keeps its own format and the phone may be any Dominican one', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', patientPayload(['document_type' => 'pasaporte', 'document_number' => 'AB123456', 'phone' => '849-555-0000']))
        ->assertSessionHasNoErrors();
});

test('a doctor phone must be complete', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo('module.doctores.access');
    $specialty = Specialty::factory()->create();

    $this->actingAs($admin)
        ->post('/admin/doctores', ['name' => 'Dr. Juan Pérez', 'phone' => '809-555', 'specialty_id' => $specialty->id])
        ->assertSessionHasErrors(['phone' => PHONE_MSG]);

    $this->actingAs($admin)
        ->put("/admin/doctores/{$this->doctor->id}", ['name' => $this->doctor->name, 'phone' => '809', 'specialty_id' => $this->doctor->specialty_id])
        ->assertSessionHasErrors(['phone' => PHONE_MSG]);
});

test('a supplier RNC and phone must be complete', function () {
    $almacen = User::factory()->create();
    $almacen->assignRole('almacen');

    $this->actingAs($almacen)
        ->post('/almacen/proveedores', ['name' => 'Laboratorios Rowe', 'rnc' => '101', 'phone' => '809'])
        ->assertSessionHasErrors([
            'rnc' => 'El RNC debe tener 9 dígitos, u 11 si es una cédula.',
            'phone' => PHONE_MSG,
        ]);

    $this->actingAs($almacen)
        ->post('/almacen/proveedores', ['name' => 'Laboratorios Rowe', 'rnc' => '101-00000-1', 'phone' => '809-555-0101'])
        ->assertSessionHasNoErrors();
});
