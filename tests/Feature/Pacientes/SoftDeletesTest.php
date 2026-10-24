<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// Helper: soft-delete a patient bypassing the model (to test before SoftDeletes trait is active)
function softDeletePatient(Patient $patient): void
{
    DB::table('patients')->where('id', $patient->id)->update(['deleted_at' => now()]);
}

// ── /pacientes excluye pacientes eliminados ──────────────────────────────────

test('/pacientes no incluye pacientes con deleted_at', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.pacientes.access');

    $active = Patient::factory()->create(['first_names' => 'Activo']);
    $deleted = Patient::factory()->create(['first_names' => 'Eliminado']);
    softDeletePatient($deleted);

    $this->actingAs($user)
        ->get('/pacientes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('patients.total', 1)
            ->where('patients.data.0.id', $active->id)
        );
});

// ── /pacientes/buscar excluye pacientes eliminados ───────────────────────────

test('/pacientes/buscar no devuelve pacientes con deleted_at', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.pacientes.access');

    Patient::factory()->create(['first_names' => 'Carlos', 'last_names' => 'Vivo']);
    $deleted = Patient::factory()->create(['first_names' => 'Carlos', 'last_names' => 'Borrado']);
    softDeletePatient($deleted);

    $response = $this->actingAs($user)
        ->get('/pacientes/buscar?q=Carlos')
        ->assertOk();

    $data = $response->json();
    expect(collect($data)->pluck('id'))->not->toContain($deleted->id);
    expect(count($data))->toBe(1);
});

// ── /registro?paciente= ignora pacientes eliminados ──────────────────────────

test('/registro?paciente= no precarga paciente con deleted_at', function () {
    $user = User::factory()->create();
    $user->assignRole('secretaria');

    $deleted = Patient::factory()->create();
    softDeletePatient($deleted);

    $this->actingAs($user)
        ->get("/registro?paciente={$deleted->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('patient', null));
});

// ── /tablero excluye turnos de pacientes eliminados ──────────────────────────

test('/tablero no muestra turno de paciente con deleted_at', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.tablero.access');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);

    // Turno activo de paciente normal
    $active = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $active->id,
        'doctor_id' => $doctor->id,
        'arrived_at' => now(),
        'status' => 'espera',
    ]);

    // Turno de paciente eliminado
    $deleted = Patient::factory()->create();
    Turn::factory()->create([
        'patient_id' => $deleted->id,
        'doctor_id' => $doctor->id,
        'arrived_at' => now(),
        'status' => 'espera',
    ]);
    softDeletePatient($deleted);

    $this->actingAs($user)
        ->get('/tablero')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->count('turns', 1)
            ->where('turns.0.patient_name', $active->full_name)
        );
});

// ── /citas excluye citas de pacientes eliminados ─────────────────────────────

test('/citas no muestra cita de paciente con deleted_at', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.citas.access');

    $specialty = Specialty::factory()->create();
    $doctor = Doctor::factory()->create(['specialty_id' => $specialty->id, 'is_active' => true]);
    $date = now()->toDateString();

    // Cita de paciente activo
    $active = Patient::factory()->create();
    Appointment::factory()->create([
        'patient_id' => $active->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => $date,
        'status' => 'pendiente',
    ]);

    // Cita de paciente eliminado
    $deleted = Patient::factory()->create();
    Appointment::factory()->create([
        'patient_id' => $deleted->id,
        'doctor_id' => $doctor->id,
        'appointment_date' => $date,
        'status' => 'pendiente',
    ]);
    softDeletePatient($deleted);

    $this->actingAs($user)
        ->get("/citas?date={$date}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->count('appointments', 1)
            ->where('appointments.0.patient_id', $active->id)
        );
});

// ── Reversibilidad de la migración ───────────────────────────────────────────

test('restore_soft_deletes migration: up → down → up sin errores', function () {
    expect(\Illuminate\Support\Facades\Schema::hasColumn('patients', 'deleted_at'))->toBeTrue();

    $this->artisan('migrate:rollback', [
        '--path' => 'database/migrations/2026_10_24_300000_restore_soft_deletes_to_patients.php',
    ])->assertSuccessful();

    expect(\Illuminate\Support\Facades\Schema::hasColumn('patients', 'deleted_at'))->toBeFalse();

    $this->artisan('migrate', [
        '--path' => 'database/migrations/2026_10_24_300000_restore_soft_deletes_to_patients.php',
        '--force' => true,
    ])->assertSuccessful();

    expect(\Illuminate\Support\Facades\Schema::hasColumn('patients', 'deleted_at'))->toBeTrue();
});
