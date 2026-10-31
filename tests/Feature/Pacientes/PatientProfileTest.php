<?php

use App\Actions\Patients\BuildPatientProfile;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->patient = Patient::factory()->create();

    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');

    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor->update(['user_id' => $this->medico->id]);
    $this->medico->refresh();

    $this->secretaria = User::factory()->create();
    $this->secretaria->assignRole('secretaria');
});

function profileAccount(Patient $patient, string $status, int $total, User $by): Account
{
    $account = Account::create([
        'patient_id' => $patient->id,
        'service_date' => today()->toDateString(),
        'status' => $status,
        'opened_at' => now(),
    ]);
    AccountCharge::create([
        'account_id' => $account->id,
        'created_by' => $by->id,
        'type' => 'consulta',
        'description' => 'Consulta',
        'quantity' => 1,
        'unit_price' => $total,
        'total' => $total,
    ]);

    return $account;
}

// ─── Access ───────────────────────────────────────────────────────────────────

test('admin gets the profile with every prop, finances included', function () {
    $this->actingAs($this->admin)
        ->get("/pacientes/{$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pacientes/show')
            ->has('patient')
            ->has('antecedentes')
            ->has('stats')
            ->has('atenciones')
            ->has('historial')
            ->has('recetas')
            ->has('estudios')
            ->whereNot('finanzas', null)
            ->where('tab', 'resumen')
        );
});

test('a non-admin doctor gets the clinical profile without finances', function () {
    $this->actingAs($this->medico)
        ->get("/pacientes/{$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pacientes/show')
            ->where('finanzas', null)
            ->has('historial')
        );
});

test('asking for the finances tab without permission falls back to the summary', function () {
    $this->actingAs($this->medico)
        ->get("/pacientes/{$this->patient->id}?tab=finanzas")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('tab', 'resumen'));
});

test('a user with Caja access sees finances', function () {
    $cajero = User::factory()->create();
    $cajero->givePermissionTo(['module.pacientes.access', 'module.caja.access']);

    $this->actingAs($cajero)
        ->get("/pacientes/{$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->whereNot('finanzas', null));
});

test('a user without pacientes access gets 403', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get("/pacientes/{$this->patient->id}")
        ->assertForbidden();
});

test('an unknown patient id returns 404', function () {
    $this->actingAs($this->admin)
        ->get('/pacientes/999999')
        ->assertNotFound();
});

test('the search route still works next to the profile route', function () {
    $this->actingAs($this->admin)
        ->get('/pacientes/buscar?q=xx')
        ->assertOk();
});

test('can_print is false for a user without an active doctor', function () {
    $this->actingAs($this->secretaria)
        ->get("/pacientes/{$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('can_print', false));

    $this->actingAs($this->medico)
        ->get("/pacientes/{$this->patient->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('can_print', true));
});

// ─── Data ─────────────────────────────────────────────────────────────────────

test('finance totals skip annulled accounts and count open and pending ones', function () {
    profileAccount($this->patient, 'anulada', 100000, $this->admin);
    profileAccount($this->patient, 'abierta', 150000, $this->admin);
    profileAccount($this->patient, 'pendiente_facturar', 50000, $this->admin);
    profileAccount($this->patient, 'facturada', 200000, $this->admin);

    $profile = app(BuildPatientProfile::class)->handle($this->patient, $this->admin);

    expect($profile['finanzas']['total_cargado'])->toBe(400000)
        ->and($profile['finanzas']['pendiente_facturar'])->toBe(200000)
        ->and($profile['finanzas']['cuentas'])->toHaveCount(4)
        ->and($profile['finanzas']['facturas'])->toBe([])
        ->and($profile['finanzas']['pagos'])->toBe([]);
});

test('the profile lists attentions, prescriptions and stats', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'atendido',
        'arrived_at' => now()->subDay(),
    ]);
    Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'no_asistio',
        'arrived_at' => now(),
    ]);
    $prescription = Prescription::create([
        'turn_id' => $turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->medico->id,
        'prescribed_at' => now()->subDay(),
    ]);
    PrescriptionItem::create([
        'prescription_id' => $prescription->id,
        'position' => 1,
        'medication' => 'Amoxicilina 500 mg',
        'dose' => '1 cápsula',
        'frequency' => 'Cada 8 horas',
        'duration_days' => 7,
        'is_continuous' => false,
        'quantity' => 21,
    ]);

    $profile = app(BuildPatientProfile::class)->handle($this->patient, $this->medico);

    expect($profile['stats']['atenciones'])->toBe(2)
        ->and($profile['stats']['ultima_atencion'])->toBe(now()->format('d/m/Y'))
        ->and($profile['atenciones']['data'])->toHaveCount(2)
        ->and($profile['atenciones']['data'][0]['status'])->toBe('no_asistio')
        ->and($profile['recetas'])->toHaveCount(1)
        ->and($profile['recetas'][0]['items'][0]['medication'])->toBe('Amoxicilina 500 mg')
        ->and($profile['historial'])->toHaveCount(1)
        ->and($profile['finanzas'])->toBeNull();
});

test('a viewer without a doctor gets the history with nothing marked as theirs', function () {
    $turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'atendido',
        'arrived_at' => now(),
    ]);
    Prescription::create([
        'turn_id' => $turn->id,
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->medico->id,
        'prescribed_at' => now(),
    ]);

    $profile = app(BuildPatientProfile::class)->handle($this->patient, $this->secretaria);

    expect($profile['historial'])->toHaveCount(1)
        ->and($profile['historial'][0]['mine'])->toBeFalse();
});
