<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;

// H – Possible duplicate detection (same name + birth_date)
// The rule returns existing patients with the same names and birth date.
// It is advisory only (no block).

function findPossibleDuplicate(string $firstName, string $lastName, string $birthDate): ?Patient
{
    return Patient::where('first_names', $firstName)
        ->where('last_names', $lastName)
        ->whereDate('birth_date', $birthDate)
        ->first();
}

// H1 – same name + birth_date returns existing patient
test('mismo nombre y fecha de nacimiento detecta posible duplicado', function () {
    $existing = Patient::factory()->create([
        'first_names' => 'María',
        'last_names' => 'González',
        'birth_date' => '1990-05-15',
    ]);

    $duplicate = findPossibleDuplicate('María', 'González', '1990-05-15');
    expect($duplicate)->not->toBeNull();
    expect($duplicate->id)->toBe($existing->id);
});

// H2 – same names but different birth date → no duplicate
test('mismos nombres pero distinta fecha de nacimiento no detecta duplicado', function () {
    Patient::factory()->create([
        'first_names' => 'María',
        'last_names' => 'González',
        'birth_date' => '1990-05-15',
    ]);

    $duplicate = findPossibleDuplicate('María', 'González', '1985-03-10');
    expect($duplicate)->toBeNull();
});

// H3 – rule does NOT block (it is advisory)
test('la regla de duplicado es solo advertencia, no bloquea el guardado', function () {
    // The backend does not reject registration when there is a possible duplicate.
    // This is verified by the absence of a 422 status when duplicate names are submitted.
    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);
    $user = User::factory()->create();
    $user->givePermissionTo('module.registro.access');

    // Create first patient
    Patient::factory()->create([
        'first_names' => 'Juan',
        'last_names' => 'García',
        'birth_date' => '1980-01-01',
    ]);

    // Second patient with same name + birth_date but different document
    $response = test()->actingAs($user)->post('/registro', [
        'document_type' => 'cedula',
        'document_number' => '999-9999999-9',
        'first_names' => 'Juan',
        'last_names' => 'García',
        'birth_date' => '1980-01-01',
        'sex' => 'M',
        'phone' => '809-555-0001',
        'attention_type' => 'consulta',
        'doctor_id' => $doctor->id,
    ]);

    // Should redirect (success), not fail validation
    $response->assertRedirect('/tablero');
    expect(Patient::where('first_names', 'Juan')->count())->toBe(2);
});
