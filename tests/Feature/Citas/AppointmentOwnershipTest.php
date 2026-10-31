<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);

    // Non-admin medico (doctor A)
    $this->doctorA = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->medico = User::factory()->create();
    $this->medico->givePermissionTo('module.citas.access');
    $this->medico->assignRole('medico');
    $this->doctorA->update(['user_id' => $this->medico->id]);
    $this->medico->refresh();
    $this->doctorA->refresh();

    // Doctor B – no user link
    $this->doctorB = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);

    $this->patient = Patient::factory()->create();
    $this->patientB = Patient::factory()->create();
});

// ─── cancel another doctor's appointment → 403 ───────────────────────────────

test('medico gets 403 when cancelling another doctors appointment', function () {
    $apptB = Appointment::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'appointment_date' => Carbon::tomorrow()->toDateString(),
        'status' => 'pendiente',
    ]);

    $this->actingAs($this->medico)
        ->delete("/citas/{$apptB->id}")
        ->assertForbidden();
});

test('medico can cancel their own appointment', function () {
    $apptA = Appointment::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'appointment_date' => Carbon::tomorrow()->toDateString(),
        'status' => 'pendiente',
    ]);

    $this->actingAs($this->medico)
        ->delete("/citas/{$apptA->id}")
        ->assertRedirect();

    expect($apptA->fresh()->status)->toBe('cancelada');
});

// ─── edit/update another doctor's appointment → 403 ─────────────────────────

test('medico gets 403 when updating another doctors appointment', function () {
    $apptB = Appointment::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'appointment_date' => Carbon::tomorrow()->toDateString(),
        'status' => 'pendiente',
    ]);

    $this->actingAs($this->medico)
        ->put("/citas/{$apptB->id}", [
            'patient_id' => $this->patientB->id,
            'doctor_id' => $this->doctorB->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'type' => 'consulta',
            'status' => 'confirmada',
        ])
        ->assertForbidden();
});

// ─── create appointment forces doctor_id to own doctor ───────────────────────

test('creating appointment with another doctors id forces own doctor_id', function () {
    $this->actingAs($this->medico)
        ->post('/citas', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorB->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'appointment_time' => '10:00',
            'type' => 'consulta',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('appointments', [
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctorA->id,
    ]);

    $this->assertDatabaseMissing('appointments', [
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctorB->id,
    ]);
});

test('admin can create appointment for any doctor', function () {
    $adminDoctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $adminUser = User::factory()->create();
    $adminUser->givePermissionTo('module.citas.access');
    $adminUser->assignRole('administrador');
    $adminUser->assignRole('medico');
    $adminDoctor->update(['user_id' => $adminUser->id]);
    $adminUser->refresh();
    $adminDoctor->refresh();

    $this->actingAs($adminUser)
        ->post('/citas', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorB->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'appointment_time' => '10:00',
            'type' => 'consulta',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('appointments', [
        'patient_id' => $this->patient->id,
        'doctor_id' => $this->doctorB->id,
    ]);
});
