<?php

use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// Shared helper: insert a patient row bypassing the model
function insertLegacyPatient(array $overrides = []): int
{
    return DB::table('patients')->insertGetId(array_merge([
        'document_type' => 'cedula',
        'document_number' => Crypt::encryptString('001-0000001-1'), // format 1
        'document_number_hash' => hash_hmac('sha256', '00100000011', config('app.key')),
        'first_names' => 'Test',
        'last_names' => 'Legacy',
        'birth_date' => '1990-01-01',
        'sex' => 'M',
        'phone' => Crypt::encryptString('809-000-0001'), // format 1
        'phone_hash' => hash_hmac('sha256', '8090000001', config('app.key')),
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ], $overrides));
}

// ── Three legacy formats readable by the updated model ────────────────────────

test('model reads phone stored with encryptString (format 1 – current)', function () {
    $id = insertLegacyPatient(['phone' => Crypt::encryptString('809-111-0001')]);
    expect(Patient::find($id)->phone)->toBe('809-111-0001');
});

test('model reads phone stored with encrypt() serialized (format 2 – legacy)', function () {
    $id = insertLegacyPatient(['phone' => encrypt('809-222-0002')]);
    expect(Patient::find($id)->phone)->toBe('809-222-0002');
});

test('model reads phone stored double-encrypted encryptString(encrypt()) (format 3)', function () {
    $id = insertLegacyPatient(['phone' => Crypt::encryptString(encrypt('809-333-0003'))]);
    expect(Patient::find($id)->phone)->toBe('809-333-0003');
});

// ── GET /pacientes handles all three formats ──────────────────────────────────

test('GET /pacientes returns 200 with patients in all three legacy phone formats', function () {
    insertLegacyPatient(['phone' => Crypt::encryptString('809-111-1111'), 'first_names' => 'Uno']);
    insertLegacyPatient(['phone' => encrypt('809-222-2222'),              'first_names' => 'Dos', 'document_number' => Crypt::encryptString('001-0000002-2'), 'document_number_hash' => hash_hmac('sha256', '00100000022', config('app.key'))]);
    insertLegacyPatient(['phone' => Crypt::encryptString(encrypt('809-333-3333')), 'first_names' => 'Tres', 'document_number' => Crypt::encryptString('001-0000003-3'), 'document_number_hash' => hash_hmac('sha256', '00100000033', config('app.key'))]);

    $admin = User::factory()->create();
    $admin->assignRole('administrador');

    $this->actingAs($admin)->get('/pacientes')->assertOk();
});

// ── Normalization migration fixes all three formats ──────────────────────────

test('normalization migration re-encrypts legacy formats and /pacientes still responds 200', function () {
    $id1 = insertLegacyPatient(['phone' => Crypt::encryptString('809-444-4444'), 'first_names' => 'Cuatro']);
    $id2 = insertLegacyPatient(['phone' => encrypt('809-555-5555'),              'first_names' => 'Cinco', 'document_number' => Crypt::encryptString('001-0000005-5'), 'document_number_hash' => hash_hmac('sha256', '00100000055', config('app.key'))]);
    $id3 = insertLegacyPatient(['phone' => Crypt::encryptString(encrypt('809-666-6666')), 'first_names' => 'Seis', 'document_number' => Crypt::encryptString('001-0000006-6'), 'document_number_hash' => hash_hmac('sha256', '00100000066', config('app.key'))]);

    // Run the normalization migration
    Artisan::call('migrate', [
        '--path' => 'database/migrations/2026_10_24_200000_normalize_patient_pii_encryption.php',
        '--force' => true,
    ]);

    // After migration all phones should decrypt with decryptString
    foreach ([$id1, $id2, $id3] as $id) {
        $raw = DB::table('patients')->where('id', $id)->value('phone');
        expect(fn () => Crypt::decryptString($raw))->not->toThrow(Exception::class);
    }

    $admin = User::factory()->create();
    $admin->assignRole('administrador');
    $this->actingAs($admin)->get('/pacientes')->assertOk();
});

// ── /registro?paciente= and /pacientes/buscar also work ──────────────────────

test('GET /registro?paciente={id} loads existing patient without 500', function () {
    $id = insertLegacyPatient(['phone' => encrypt('809-777-7777')]);

    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $this->actingAs($user)
        ->get("/registro?paciente={$id}")
        ->assertOk();
});

test('GET /pacientes/buscar?q= returns 200 with legacy phone data', function () {
    insertLegacyPatient(['phone' => encrypt('809-888-8888'), 'first_names' => 'Búsqueda']);

    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $this->actingAs($user)
        ->get('/pacientes/buscar?q=Búsqueda')
        ->assertOk();
});
