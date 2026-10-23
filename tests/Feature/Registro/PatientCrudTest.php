<?php

use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');
});

// ─── Search ─────────────────────────────────────────────────────────────────

test('search redirects unauthenticated users', function () {
    $this->get('/registro/pacientes/buscar?q=maria')
        ->assertRedirect('/login');
});

test('search returns 403 without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/registro/pacientes/buscar?q=maria')
        ->assertForbidden();
});

test('search returns empty array when query is too short', function () {
    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/buscar?q=m')
        ->assertOk()
        ->assertExactJson([]);
});

test('search returns matching patients by name', function () {
    Patient::factory()->create([
        'first_names' => 'Carla',
        'last_names' => 'Torres',
        'document_number' => '001-1234567-8',
    ]);
    Patient::factory()->create(['first_names' => 'Juan', 'last_names' => 'Perez', 'document_number' => '001-9999999-9']);

    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/buscar?q=Carla')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonFragment(['document_number' => '001-1234567-8']);
});

test('search returns matching patients by exact document number', function () {
    $patient = Patient::factory()->create(['document_number' => '001-9876543-2']);

    // document_number is encrypted – search uses HMAC hash for exact match
    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/buscar?q=001-9876543-2')
        ->assertOk()
        ->assertJsonFragment(['id' => $patient->id]);
});

test('search does not find partial document number (encrypted field)', function () {
    Patient::factory()->create(['document_number' => '001-9876543-2']);

    // Partial match is not possible on encrypted columns
    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/buscar?q=9876543')
        ->assertOk()
        ->assertJsonCount(0);
});

test('search does not return soft-deleted patients', function () {
    $patient = Patient::factory()->create(['first_names' => 'Borrado']);
    $patient->delete();

    $this->actingAs($this->secretaria)
        ->getJson('/registro/pacientes/buscar?q=Borrado')
        ->assertOk()
        ->assertJsonCount(0);
});

// ─── Store ───────────────────────────────────────────────────────────────────

test('store redirects unauthenticated users', function () {
    $this->post('/registro/pacientes', [])->assertRedirect('/login');
});

test('store returns 403 without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/registro/pacientes', [])
        ->assertForbidden();
});

test('store creates a patient with valid data', function () {
    $data = [
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
        'first_names' => 'María',
        'last_names' => 'García López',
        'birth_date' => '1982-05-15',
        'sex' => 'F',
        'phone' => '809-555-0001',
        'address' => 'Calle Principal #12',
        'blood_type' => 'O+',
        'allergies' => 'Penicilina',
        'emergency_contact_name' => 'Pedro García',
        'emergency_contact_phone' => '809-555-0002',
    ];

    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', $data)
        ->assertRedirect('/registro');

    // document_number is encrypted in DB – verify via its HMAC hash
    $this->assertDatabaseHas('patients', [
        'document_number_hash' => hash_hmac('sha256', '001-1234567-8', config('app.key')),
        'first_names' => 'María',
        'last_names' => 'García López',
        'sex' => 'F',
    ]);
});

test('store validates required fields', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [])
        ->assertSessionHasErrors([
            'document_type',
            'document_number',
            'first_names',
            'last_names',
            'birth_date',
            'sex',
        ]);
});

test('store creates a patient with cedula_extranjera type', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula_extranjera',
            'document_number' => 'CE-123456789',
            'first_names' => 'John',
            'last_names' => 'Smith',
            'birth_date' => '1990-06-15',
            'sex' => 'M',
        ])
        ->assertRedirect('/registro');

    $this->assertDatabaseHas('patients', [
        'document_type' => 'cedula_extranjera',
        'first_names' => 'John',
    ]);
});

test('store creates a patient with no_tiene type and auto-assigns document number', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'no_tiene',
            'first_names' => 'Sin',
            'last_names' => 'Documento',
            'birth_date' => '2000-01-01',
            'sex' => 'M',
        ])
        ->assertRedirect('/registro');

    $patient = Patient::where('first_names', 'Sin')->first();

    expect($patient)->not->toBeNull()
        ->and($patient->document_number)->toStartWith('GEN-')
        ->and(strlen($patient->document_number))->toBe(12); // GEN- (4) + 8 chars
});

test('store rejects invalid document type', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'dni_invalido',
            'document_number' => '12345',
            'first_names' => 'X',
            'last_names' => 'X',
            'birth_date' => '1990-01-01',
            'sex' => 'M',
        ])
        ->assertSessionHasErrors(['document_type']);
});

test('store rejects invalid sex value', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'María',
            'last_names' => 'García',
            'birth_date' => '1982-05-15',
            'sex' => 'X',
        ])
        ->assertSessionHasErrors(['sex']);
});

test('store rejects duplicate document number', function () {
    Patient::factory()->create(['document_number' => '001-1234567-8']);

    // The UniqueDocumentNumber rule checks document_number_hash (not the encrypted column)
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Juan',
            'last_names' => 'Perez',
            'birth_date' => '1990-01-01',
            'sex' => 'M',
        ])
        ->assertSessionHasErrors(['document_number']);
});

test('store rejects future birth date', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Bebé',
            'last_names' => 'Futuro',
            'birth_date' => now()->addDay()->format('Y-m-d'),
            'sex' => 'M',
        ])
        ->assertSessionHasErrors(['birth_date']);
});

// ─── Update ──────────────────────────────────────────────────────────────────

test('update redirects unauthenticated users', function () {
    $patient = Patient::factory()->create();

    $this->put("/registro/pacientes/{$patient->id}", [])->assertRedirect('/login');
});

test('update returns 403 without permission', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();

    $this->actingAs($user)
        ->put("/registro/pacientes/{$patient->id}", [])
        ->assertForbidden();
});

test('update modifies patient data', function () {
    $patient = Patient::factory()->create();

    $this->actingAs($this->secretaria)
        ->put("/registro/pacientes/{$patient->id}", [
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'first_names' => 'Nuevo Nombre',
            'last_names' => $patient->last_names,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'sex' => $patient->sex,
        ])
        ->assertRedirect('/registro');

    $this->assertDatabaseHas('patients', [
        'id' => $patient->id,
        'first_names' => 'Nuevo Nombre',
    ]);
});

test('update allows keeping the same document number', function () {
    $patient = Patient::factory()->create(['document_number' => '001-1234567-8']);

    $this->actingAs($this->secretaria)
        ->put("/registro/pacientes/{$patient->id}", [
            'document_type' => $patient->document_type,
            'document_number' => '001-1234567-8',
            'first_names' => $patient->first_names,
            'last_names' => $patient->last_names,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'sex' => $patient->sex,
        ])
        ->assertRedirect('/registro');
});

test('update returns 404 for non-existent patient', function () {
    $this->actingAs($this->secretaria)
        ->put('/registro/pacientes/9999', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'X',
            'last_names' => 'X',
            'birth_date' => '1990-01-01',
            'sex' => 'M',
        ])
        ->assertNotFound();
});

// ─── Photo upload ────────────────────────────────────────────────────────────

test('store saves photo when image is provided', function () {
    Storage::fake('public');

    $image = UploadedFile::fake()->image('cedula.jpg', 400, 300);

    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Ana',
            'last_names' => 'Pérez',
            'birth_date' => '1990-01-01',
            'sex' => 'F',
            'photo' => $image,
        ])
        ->assertRedirect('/registro');

    $patient = Patient::where('first_names', 'Ana')->first();

    expect($patient->photo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($patient->photo_path);
});

test('store saves photo when PDF is provided', function () {
    Storage::fake('public');

    $pdf = UploadedFile::fake()->create('cedula.pdf', 512, 'application/pdf');

    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Ana',
            'last_names' => 'Pérez',
            'birth_date' => '1990-01-01',
            'sex' => 'F',
            'photo' => $pdf,
        ])
        ->assertRedirect('/registro');

    $patient = Patient::where('first_names', 'Ana')->first();
    Storage::disk('public')->assertExists($patient->photo_path);
});

test('store rejects photo exceeding 5 MB', function () {
    Storage::fake('public');

    $big = UploadedFile::fake()->create('foto.jpg', 6000, 'image/jpeg');

    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Ana',
            'last_names' => 'Pérez',
            'birth_date' => '1990-01-01',
            'sex' => 'F',
            'photo' => $big,
        ])
        ->assertSessionHasErrors(['photo']);
});

test('store rejects invalid file type for photo', function () {
    Storage::fake('public');

    $exe = UploadedFile::fake()->create('virus.exe', 100, 'application/octet-stream');

    $this->actingAs($this->secretaria)
        ->post('/registro/pacientes', [
            'document_type' => 'cedula',
            'document_number' => '001-1234567-8',
            'first_names' => 'Ana',
            'last_names' => 'Pérez',
            'birth_date' => '1990-01-01',
            'sex' => 'F',
            'photo' => $exe,
        ])
        ->assertSessionHasErrors(['photo']);
});

test('update replaces photo and deletes old file', function () {
    Storage::fake('public');

    $patient = Patient::factory()->create();
    $oldPath = 'patients/photos/old.jpg';
    Storage::disk('public')->put($oldPath, 'old content');
    $patient->update(['photo_path' => $oldPath]);

    $newImage = UploadedFile::fake()->image('new.jpg', 400, 300);

    $this->actingAs($this->secretaria)
        ->put("/registro/pacientes/{$patient->id}", [
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'first_names' => $patient->first_names,
            'last_names' => $patient->last_names,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'sex' => $patient->sex,
            'photo' => $newImage,
        ])
        ->assertRedirect('/registro');

    Storage::disk('public')->assertMissing($oldPath);
    $patient->refresh();
    Storage::disk('public')->assertExists($patient->photo_path);
});

test('update removes photo when remove_photo flag is set', function () {
    Storage::fake('public');

    $patient = Patient::factory()->create();
    $oldPath = 'patients/photos/old.jpg';
    Storage::disk('public')->put($oldPath, 'old content');
    $patient->update(['photo_path' => $oldPath]);

    $this->actingAs($this->secretaria)
        ->put("/registro/pacientes/{$patient->id}", [
            'document_type' => $patient->document_type,
            'document_number' => $patient->document_number,
            'first_names' => $patient->first_names,
            'last_names' => $patient->last_names,
            'birth_date' => $patient->birth_date->format('Y-m-d'),
            'sex' => $patient->sex,
            'remove_photo' => true,
        ])
        ->assertRedirect('/registro');

    Storage::disk('public')->assertMissing($oldPath);
    expect($patient->fresh()->photo_path)->toBeNull();
});

// ─── Destroy ─────────────────────────────────────────────────────────────────

test('destroy redirects unauthenticated users', function () {
    $patient = Patient::factory()->create();

    $this->delete("/registro/pacientes/{$patient->id}")->assertRedirect('/login');
});

test('destroy returns 403 without permission', function () {
    $user = User::factory()->create();
    $patient = Patient::factory()->create();

    $this->actingAs($user)
        ->delete("/registro/pacientes/{$patient->id}")
        ->assertForbidden();
});

test('destroy soft-deletes the patient', function () {
    $patient = Patient::factory()->create();

    $this->actingAs($this->secretaria)
        ->delete("/registro/pacientes/{$patient->id}")
        ->assertRedirect('/registro');

    $this->assertSoftDeleted('patients', ['id' => $patient->id]);
});

test('destroy returns 404 for non-existent patient', function () {
    $this->actingAs($this->secretaria)
        ->delete('/registro/pacientes/9999')
        ->assertNotFound();
});
