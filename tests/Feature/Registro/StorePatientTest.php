<?php

use App\Models\Patient;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');
});

// SP1 – unauthenticated → redirect
test('POST /registro/pacientes redirects unauthenticated users', function () {
    $this->post('/registro/pacientes', [])
        ->assertRedirect('/login');
});

// SP2 – no permission → 403
test('POST /registro/pacientes returns 403 without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/registro/pacientes', [])
        ->assertForbidden();
});

// SP3 – happy path: creates patient, does NOT create turn, redirects with flash
test('POST /registro/pacientes creates patient and redirects to pacientes with flash', function () {
    $payload = [
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
        'first_names' => 'María',
        'last_names' => 'Pérez',
        'birth_date' => '1990-05-15',
        'sex' => 'F',
        'phone' => '809-555-1234',
        'address' => 'Calle 1',
        'blood_type' => 'O+',
        'allergies' => 'Ninguna',
        'emergency_contact_name' => 'Juan Pérez',
        'emergency_contact_phone' => '809-555-5678',
    ];

    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', $payload)
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Paciente registrado.');

    $patient = Patient::latest('id')->first();
    expect($patient)->not->toBeNull();
    expect($patient->first_names)->toBe('María');

    // No turn should be created
    expect(Turn::where('patient_id', $patient->id)->count())->toBe(0);

    // Redirect URL should include paciente param
    $response = $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', array_merge($payload, [
            'document_number' => '001-9999999-9',
        ]));
    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('paciente=');
});

// SP4 – validation: missing required fields
test('POST /registro/pacientes returns 422 when required fields are missing', function () {
    $this->actingAs($this->secretaria)
        ->postJson('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            // missing first_names, last_names, birth_date, sex, emergency_contact_*
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['first_names', 'last_names', 'birth_date', 'sex']);
});

// SP5 – validation: duplicate document number
test('POST /registro/pacientes returns 422 when document number already exists', function () {
    Patient::factory()->create([
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
    ]);

    $this->actingAs($this->secretaria)
        ->postJson('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Ana',
            'last_names' => 'García',
            'birth_date' => '1985-03-20',
            'sex' => 'F',
            'emergency_contact_name' => 'Pedro',
            'emergency_contact_phone' => '809-555-0000',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['document_number']);
});

// SP6 – no_tiene: patient is created with generated document number
test('POST /registro/pacientes creates patient with no_tiene document type', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'no_tiene',
            'document_number' => '',
            'first_names' => 'Anónimo',
            'last_names' => 'Apellido',
            'birth_date' => '2000-01-01',
            'sex' => 'M',
            'phone' => '809-000-0000',
            'emergency_contact_name' => 'X',
            'emergency_contact_phone' => '809-000-0000',
        ])
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success')
        ->assertSessionHas('inertia.flash_data.toast.message', 'Paciente registrado.');

    $patient = Patient::where('first_names', 'Anónimo')->latest('id')->first();
    expect($patient)->not->toBeNull();
    expect($patient->document_type)->toBe('no_tiene');
    expect(Turn::where('patient_id', $patient->id)->count())->toBe(0);
});
