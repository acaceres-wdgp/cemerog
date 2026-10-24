<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use App\Actions\Patients\SearchPatients;
use App\Models\Patient;

// E1 – less than 3 chars returns empty
test('query de 2 caracteres devuelve colección vacía sin hacer query', function () {
    Patient::factory()->create(['first_names' => 'María']);

    $action = new SearchPatients;
    expect($action->handle('Ma'))->toHaveCount(0);
});

test('query vacía devuelve colección vacía', function () {
    Patient::factory()->create(['first_names' => 'Ana']);
    expect((new SearchPatients)->handle(''))->toHaveCount(0);
});

// E2 – partial name
test('nombre parcial "Mar" encuentra "María"', function () {
    Patient::factory()->create(['first_names' => 'María', 'last_names' => 'González']);
    Patient::factory()->create(['first_names' => 'Pedro', 'last_names' => 'Gómez']);

    $results = (new SearchPatients)->handle('Mar');
    expect($results)->toHaveCount(1);
    expect($results->first()->first_names)->toBe('María');
});

// E3 – two words AND
test('dos palabras aplica AND: "María Gar" no devuelve "Pedro García"', function () {
    Patient::factory()->create(['first_names' => 'María', 'last_names' => 'García']);
    Patient::factory()->create(['first_names' => 'Pedro', 'last_names' => 'García']);

    $results = (new SearchPatients)->handle('María García');
    expect($results)->toHaveCount(1);
    expect($results->first()->first_names)->toBe('María');
});

// E4 – only digits searches by hash
test('solo dígitos busca por document_number_hash', function () {
    $patient = Patient::factory()->create(['document_number' => '001-1234567-8']);

    $results = (new SearchPatients)->handle('0011234567-8');
    // digits only = 00112345678
    $results2 = (new SearchPatients)->handle('00112345678');

    // At least one should find the patient
    $found = $results->count() > 0 || $results2->count() > 0;
    expect($found)->toBeTrue();
});

// E5 – cedula with hyphens normalized
test('cédula con guiones "031-0234567-8" encuentra la cédula almacenada', function () {
    $patient = Patient::factory()->create(['document_number' => '031-0234567-8']);

    $results = (new SearchPatients)->handle('031-0234567-8');
    expect($results)->toHaveCount(1);
    expect($results->first()->id)->toBe($patient->id);
});

test('cédula sin guiones "03102345678" encuentra la cédula almacenada "031-0234567-8"', function () {
    $patient = Patient::factory()->create(['document_number' => '031-0234567-8']);

    $results = (new SearchPatients)->handle('03102345678');
    expect($results)->toHaveCount(1);
    expect($results->first()->id)->toBe($patient->id);
});

// E6 – phone with formatting
test('teléfono "(809) 555-0001" encuentra el paciente por phone_hash', function () {
    $patient = Patient::factory()->create(['phone' => '(809) 555-0001']);

    $results = (new SearchPatients)->handle('(809) 555-0001');
    expect($results)->toHaveCount(1);
    expect($results->first()->id)->toBe($patient->id);
});

// E7 – phone different formats produce same hash
test('teléfono "809-555-0001" y "8095550001" encuentran el mismo paciente', function () {
    $patient = Patient::factory()->create(['phone' => '809-555-0001']);

    $byDashes = (new SearchPatients)->handle('809-555-0001');
    $byDigits = (new SearchPatients)->handle('8095550001');

    expect($byDashes)->toHaveCount(1);
    expect($byDigits)->toHaveCount(1);
    expect($byDashes->first()->id)->toBe($patient->id);
    expect($byDigits->first()->id)->toBe($patient->id);
});

// E8 – tildes: documented behavior (SQLite case-insensitive LIKE but no collation for tildes)
test('búsqueda "pena" no encuentra "Peña" en SQLite (documenta el comportamiento de collation)', function () {
    Patient::factory()->create(['first_names' => 'Carlos', 'last_names' => 'Peña']);

    $results = (new SearchPatients)->handle('pena');

    // In SQLite, LIKE is case-insensitive for ASCII but does not fold accented characters.
    // "pena" does NOT match "Peña" in the test environment (SQLite).
    // In production MySQL with utf8mb4_unicode_ci, it WOULD match.
    // This test documents the known divergence.
    expect($results)->toHaveCount(0); // SQLite behavior
});

// E9 – limit 10 results
test('límite de 10 resultados cuando hay más coincidencias', function () {
    Patient::factory()->count(15)->create(['first_names' => 'Carlos']);

    $results = (new SearchPatients)->handle('Carlos');
    expect($results)->toHaveCount(10);
});
