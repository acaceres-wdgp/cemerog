<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'is_active' => true,
        'consultation_price' => 200000, // RD$2,000.00
        'consultation_fee' => 30000,    // RD$300.00
    ]);

    $this->patient = Patient::factory()->create();
});

function registrationPayload(Patient $patient, int $doctorId): array
{
    return [
        'patient_id' => $patient->id,
        'first_names' => $patient->first_names,
        'last_names' => $patient->last_names,
        'document_type' => $patient->document_type,
        'document_number' => $patient->document_number,
        'birth_date' => $patient->birth_date->format('Y-m-d'),
        'sex' => $patient->sex,
        'phone' => $patient->phone ?? '809-555-0001',
        'attention_type' => 'consulta',
        'doctor_id' => $doctorId,
    ];
}

// ─── A1: Arrival creates account + charge ────────────────────────────────────

test('registering an arrival creates a daily account and a consultation charge', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $this->doctor->id))
        ->assertRedirect('/tablero');

    expect(Account::count())->toBe(1);
    expect(AccountCharge::count())->toBe(1);

    $account = Account::first();
    expect($account->patient_id)->toBe($this->patient->id);
    expect($account->status)->toBe('abierta');

    $charge = AccountCharge::first();
    expect($charge->type)->toBe('consulta');
    expect($charge->unit_price)->toBe(200000);
    expect($charge->total)->toBe(200000);
    expect($charge->doctor_fee)->toBe(30000);
    expect($charge->doctor_id)->toBe($this->doctor->id);
});

// ─── A2: Amounts are integers ─────────────────────────────────────────────────

test('all charge amounts are stored as integers (cents)', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $this->doctor->id));

    $charge = AccountCharge::first();
    expect($charge->unit_price)->toBeInt();
    expect($charge->total)->toBeInt();
    expect($charge->doctor_fee)->toBeInt();
    expect($charge->quantity)->toBeInt();
});

// ─── A3: Changing doctor price does NOT alter saved charge ────────────────────

test('changing doctor price afterwards does not alter the saved charge', function () {
    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $this->doctor->id));

    // Change doctor price after the fact
    $this->doctor->update(['consultation_price' => 999999]);

    $charge = AccountCharge::first();
    expect($charge->unit_price)->toBe(200000); // unchanged
    expect($charge->total)->toBe(200000); // unchanged
});

// ─── A4: Two arrivals same day → ONE account, TWO charges ────────────────────

test('two arrivals same day with different doctors create one account and two charges', function () {
    $specialtyB = Specialty::factory()->create(['name' => 'Cardiología']);
    $doctorB = Doctor::factory()->create([
        'specialty_id' => $specialtyB->id,
        'is_active' => true,
        'consultation_price' => 300000,
        'consultation_fee' => 50000,
    ]);

    // Register with doctor A
    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $this->doctor->id))
        ->assertRedirect('/tablero');

    // Register with doctor B (same patient, same day)
    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $doctorB->id))
        ->assertRedirect('/tablero');

    expect(Account::where('patient_id', $this->patient->id)->count())->toBe(1);
    expect(AccountCharge::whereHas('account', fn ($q) => $q->where('patient_id', $this->patient->id))->count())->toBe(2);
});

// ─── A5: Billed account + new arrival → NEW account ─────────────────────────

test('arriving after a billed account opens a new account same day', function () {
    // Create a billed account for today
    Account::create([
        'patient_id' => $this->patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'facturada',
        'opened_at' => now()->subHours(4),
        'closed_at' => now()->subHour(),
    ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $this->doctor->id))
        ->assertRedirect('/tablero');

    expect(Account::where('patient_id', $this->patient->id)->count())->toBe(2);
    expect(Account::where('patient_id', $this->patient->id)->where('status', 'abierta')->count())->toBe(1);
});

// ─── A5b: Same-day return before billing → the same account reopens ─────────

test('returning the same day before billing reopens the account so it is one invoice', function () {
    $account = Account::create([
        'patient_id' => $this->patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'pendiente_facturar',
        'opened_at' => now()->subHours(4),
        'closed_at' => now()->subHour(),
    ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $this->doctor->id))
        ->assertRedirect('/tablero');

    $account->refresh();
    expect(Account::where('patient_id', $this->patient->id)->count())->toBe(1)
        ->and($account->status)->toBe('abierta')
        ->and($account->closed_at)->toBeNull()
        ->and($account->charges()->count())->toBe(1);
});

test('a void (empty) account of the same day is not reopened', function () {
    Account::create([
        'patient_id' => $this->patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'anulada',
        'opened_at' => now()->subHours(4),
        'closed_at' => now()->subHour(),
    ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', registrationPayload($this->patient, $this->doctor->id));

    expect(Account::where('patient_id', $this->patient->id)->count())->toBe(2);
});

// ─── A6: Tablero turn also creates account + charge ──────────────────────────

test('registering via tablero also creates a daily account and charge', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.tablero.access');

    $this->actingAs($user)
        ->post('/tablero/turnos', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
        ])
        ->assertRedirect('/tablero');

    expect(Account::count())->toBe(1);
    expect(AccountCharge::count())->toBe(1);
});

// ─── A7: Second arrival same day reuses the open account ─────────────────────
//
// Note: true concurrent locking cannot be tested with SQLite (single writer).
// The production lock is enforced by Patient::lockForUpdate() inside the
// RegisterArrival transaction, which serialises access in MySQL. Here we verify
// the sequential behaviour: a second call reuses the existing open account.

test('a second arrival the same day reuses the already-open account', function () {
    $specialtyB = Specialty::factory()->create(['name' => 'Cardiología']);
    $doctorB = Doctor::factory()->create([
        'specialty_id' => $specialtyB->id,
        'is_active' => true,
        'consultation_price' => 300000,
        'consultation_fee' => 50000,
    ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $this->patient->id,
            'first_names' => $this->patient->first_names,
            'last_names' => $this->patient->last_names,
            'document_type' => $this->patient->document_type,
            'document_number' => $this->patient->document_number,
            'birth_date' => $this->patient->birth_date->format('Y-m-d'),
            'sex' => $this->patient->sex,
            'phone' => $this->patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $this->doctor->id,
        ]);

    $this->actingAs($this->secretaria)
        ->post('/registro', [
            'patient_id' => $this->patient->id,
            'first_names' => $this->patient->first_names,
            'last_names' => $this->patient->last_names,
            'document_type' => $this->patient->document_type,
            'document_number' => $this->patient->document_number,
            'birth_date' => $this->patient->birth_date->format('Y-m-d'),
            'sex' => $this->patient->sex,
            'phone' => $this->patient->phone ?? '809-555-0001',
            'attention_type' => 'consulta',
            'doctor_id' => $doctorB->id,
        ]);

    expect(Account::where('patient_id', $this->patient->id)->where('status', 'abierta')->count())->toBe(1);
    expect(AccountCharge::count())->toBe(2);
});
