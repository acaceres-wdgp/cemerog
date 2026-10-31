<?php

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;

beforeEach(function () {
    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);

    // Doctor A – non-admin medico
    $this->doctorA = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->medico = User::factory()->create();
    $this->medico->givePermissionTo('module.tablero.access');
    $this->medico->givePermissionTo('module.citas.access');
    $this->medico->assignRole('medico');
    $this->doctorA->update(['user_id' => $this->medico->id]);
    $this->medico->refresh();
    $this->doctorA->refresh();

    // Doctor B – another doctor, no user link
    $this->doctorB = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);

    // Admin (also a doctor)
    $this->adminDoctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->adminUser = User::factory()->create();
    $this->adminUser->givePermissionTo('module.tablero.access');
    $this->adminUser->givePermissionTo('module.citas.access');
    $this->adminUser->assignRole('administrador');
    $this->adminUser->assignRole('medico');
    $this->adminDoctor->update(['user_id' => $this->adminUser->id]);
    $this->adminUser->refresh();
    $this->adminDoctor->refresh();

    // Secretary – no doctor link
    $this->secretary = User::factory()->create();
    $this->secretary->givePermissionTo('module.tablero.access');
    $this->secretary->givePermissionTo('module.citas.access');
    $this->secretary->assignRole('secretaria');

    $this->patient = Patient::factory()->create();
    $this->patientB = Patient::factory()->create();
});

// ─── seesOnlyOwnSchedule ──────────────────────────────────────────────────────

test('medico without admin role returns true for seesOnlyOwnSchedule', function () {
    expect($this->medico->seesOnlyOwnSchedule())->toBeTrue();
});

test('admin+medico returns false for seesOnlyOwnSchedule', function () {
    expect($this->adminUser->seesOnlyOwnSchedule())->toBeFalse();
});

test('secretary returns false for seesOnlyOwnSchedule', function () {
    expect($this->secretary->seesOnlyOwnSchedule())->toBeFalse();
});

// ─── Tablero visibility ───────────────────────────────────────────────────────

test('medico only sees their own turns in Tablero', function () {
    $turnA = Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);
    $turnB = Turn::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->medico)
        ->get('/tablero')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tablero/index')
            ->where('turns', fn ($turns) => collect($turns)->pluck('id')
                ->contains($turnA->id)
                && collect($turns)->pluck('id')->doesntContain($turnB->id)
            )
        );
});

test('medico only sees their own appointments in Tablero', function () {
    Appointment::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'appointment_date' => today(),
        'status' => 'pendiente',
    ]);
    $apptB = Appointment::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'appointment_date' => today(),
        'status' => 'pendiente',
    ]);

    $this->actingAs($this->medico)
        ->get('/tablero')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('appointments', fn ($appts) => collect($appts)->pluck('id')
                ->doesntContain($apptB->id)
            )
        );
});

test('admin+medico sees all turns in Tablero', function () {
    Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);
    Turn::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->adminUser)
        ->get('/tablero')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('en_espera', 2)
        );
});

test('secretary sees all turns in Tablero', function () {
    Turn::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);
    Turn::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'status' => 'espera',
        'arrived_at' => now(),
    ]);

    $this->actingAs($this->secretary)
        ->get('/tablero')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('en_espera', 2)
        );
});

// ─── Citas visibility ─────────────────────────────────────────────────────────

test('medico only sees their own appointments in Citas', function () {
    $myAppt = Appointment::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'appointment_date' => today(),
        'status' => 'pendiente',
    ]);
    $otherAppt = Appointment::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'appointment_date' => today(),
        'status' => 'pendiente',
    ]);

    $this->actingAs($this->medico)
        ->get('/citas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('appointments', fn ($appts) => collect($appts)->pluck('id')
                ->contains($myAppt->id)
                && collect($appts)->pluck('id')->doesntContain($otherAppt->id)
            )
        );
});

test('medico doctor selector in Citas contains only their own doctor', function () {
    $this->actingAs($this->medico)
        ->get('/citas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('doctors', fn ($docs) => count($docs) === 1
                && $docs[0]['id'] === $this->doctorA->id
            )
        );
});

test('admin sees all appointments in Citas', function () {
    Appointment::factory()->create([
        'doctor_id' => $this->doctorA->id,
        'patient_id' => $this->patient->id,
        'appointment_date' => today(),
        'status' => 'pendiente',
    ]);
    Appointment::factory()->create([
        'doctor_id' => $this->doctorB->id,
        'patient_id' => $this->patientB->id,
        'appointment_date' => today(),
        'status' => 'pendiente',
    ]);

    $this->actingAs($this->adminUser)
        ->get('/citas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('appointments', fn ($appts) => count($appts) === 2)
        );
});
