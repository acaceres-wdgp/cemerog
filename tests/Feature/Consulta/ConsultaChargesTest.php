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
    // Admin-doctor user
    $this->adminDoctorUser = User::factory()->create();
    $this->adminDoctorUser->assignRole(['medico', 'administrador']);

    // Non-admin doctor user
    $this->doctorUser = User::factory()->create();
    $this->doctorUser->assignRole('medico');

    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);

    $this->doctorA = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $this->adminDoctorUser->id,
        'is_active' => true,
        'consultation_price' => 200000,
        'consultation_fee' => 30000,
    ]);

    $this->doctorB = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'user_id' => $this->doctorUser->id,
        'is_active' => true,
        'consultation_price' => 300000,
        'consultation_fee' => 50000,
    ]);

    $this->patient = Patient::factory()->create();

    // Create account for today
    $this->account = Account::create([
        'patient_id' => $this->patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'abierta',
        'opened_at' => now(),
    ]);

    // Turn for doctorA (admin-doctor)
    $this->turnA = Turn::factory()->create([
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctorA->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);

    // Turn for doctorB (non-admin doctor)
    $this->turnB = Turn::factory()->create([
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctorB->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    // Charge from doctorA
    $this->chargeA = AccountCharge::create([
        'account_id' => $this->account->id,
        'turn_id' => $this->turnA->id,
        'doctor_id' => $this->doctorA->id,
        'created_by' => $this->adminDoctorUser->id,
        'type' => 'consulta',
        'description' => 'Consulta – Dr. A',
        'quantity' => 1,
        'unit_price' => 200000,
        'total' => 200000,
        'doctor_fee' => 30000,
    ]);

    // Charge from doctorB
    $this->chargeB = AccountCharge::create([
        'account_id' => $this->account->id,
        'turn_id' => $this->turnB->id,
        'doctor_id' => $this->doctorB->id,
        'created_by' => $this->doctorUser->id,
        'type' => 'consulta',
        'description' => 'Consulta – Dr. B',
        'quantity' => 1,
        'unit_price' => 300000,
        'total' => 300000,
        'doctor_fee' => 50000,
    ]);
});

// ─── V1: Admin+doctor sees ALL charges ───────────────────────────────────────

test('doctor who is also admin sees all charges for the account', function () {
    $this->actingAs($this->adminDoctorUser)
        ->get("/consulta?patient_id={$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('charges', 2)
            ->where('charges_total', 500000) // 200000 + 300000
        );
});

// ─── V2: Non-admin doctor sees ONLY own charges ───────────────────────────────

test('non-admin doctor sees only their own charges', function () {
    $this->actingAs($this->doctorUser)
        ->get("/consulta?patient_id={$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('charges', 1)
            ->where('charges.0.doctor_id', $this->doctorB->id)
            ->where('charges_total', 300000)
        );
});

// ─── V3: Non-doctor admin cannot access Consulta ─────────────────────────────

test('non-doctor admin gets 403 on Consulta', function () {
    $adminOnly = User::factory()->create();
    $adminOnly->assignRole('administrador');

    $this->actingAs($adminOnly)
        ->get('/consulta')
        ->assertForbidden();
});
