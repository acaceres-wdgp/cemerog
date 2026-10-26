<?php

use App\Models\Patient;
use App\Models\User;
use App\Support\Pii;

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');
});

// E1 – unauthenticated → redirect
test('GET /registro/pacientes/existe redirects unauthenticated users', function () {
    $this->get('/registro/pacientes/existe?documento=001-1234567-8')
        ->assertRedirect('/login');
});

// E2 – no permission → 403
test('GET /registro/pacientes/existe returns 403 without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/registro/pacientes/existe?documento=001-1234567-8')
        ->assertForbidden();
});

// E3 – finds by cédula with hyphens
test('GET /registro/pacientes/existe finds patient by cédula with hyphens', function () {
    $patient = Patient::factory()->create([
        'document_type' => 'cedula',
        'document_number' => Pii::encrypt('001-1234567-8'),
        'document_number_hash' => Pii::hash('001-1234567-8', fallbackToFull: true),
    ]);

    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/existe?documento=001-1234567-8')
        ->assertOk()
        ->assertJsonFragment(['id' => $patient->id]);
});

// E4 – finds by cédula without hyphens (same hash)
test('GET /registro/pacientes/existe finds patient by cédula without hyphens', function () {
    $patient = Patient::factory()->create([
        'document_type' => 'cedula',
        'document_number' => Pii::encrypt('001-1234567-8'),
        'document_number_hash' => Pii::hash('001-1234567-8', fallbackToFull: true),
    ]);

    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/existe?documento=00112345678')
        ->assertOk()
        ->assertJsonFragment(['id' => $patient->id]);
});

// E5 – finds by passport with letters
test('GET /registro/pacientes/existe finds patient by passport with letters', function () {
    $passport = 'AB123456';
    $patient = Patient::factory()->create([
        'document_type' => 'pasaporte',
        'document_number' => Pii::encrypt($passport),
        'document_number_hash' => Pii::hash($passport, fallbackToFull: true),
    ]);

    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/existe?documento=AB123456')
        ->assertOk()
        ->assertJsonFragment(['id' => $patient->id]);
});

// E6 – returns null when no patient found
test('GET /registro/pacientes/existe returns null when no patient exists', function () {
    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/existe?documento=001-9999999-9')
        ->assertOk()
        ->assertContent('null');
});

// E7 – partial document returns null (no LIKE)
test('GET /registro/pacientes/existe does not match partial documents', function () {
    Patient::factory()->create([
        'document_type' => 'cedula',
        'document_number' => Pii::encrypt('001-1234567-8'),
        'document_number_hash' => Pii::hash('001-1234567-8', fallbackToFull: true),
    ]);

    // '001-1234' is a prefix of the stored document but should NOT match
    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/existe?documento=001-1234')
        ->assertOk()
        ->assertContent('null');
});
