<?php

use App\Models\Account;
use App\Models\Discharge;
use App\Models\Doctor;
use App\Models\Emergency;
use App\Models\EmergencyCubicle;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->enfermera = User::factory()->create();
    $this->enfermera->assignRole('enfermeria');

    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'user_id' => $this->medico->id,
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);

    $this->patient = Patient::factory()->create();
    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', [
        'patient_id' => $this->patient->id,
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => $this->doctor->id,
        'reason' => 'Crisis asmática.',
    ])->assertSessionHasNoErrors();
    $this->emergency = Emergency::first();
});

test('the doctor discharges the patient as in Consulta: cubicle freed and account to billing', function () {
    $this->actingAs($this->medico)
        ->post("/emergencia/{$this->emergency->id}/alta", [
            'type' => 'recuperado',
            'discharge_diagnosis' => 'Crisis asmática resuelta.',
        ])
        ->assertRedirect(route('emergencia'))
        ->assertSessionHasNoErrors();

    $emergency = $this->emergency->fresh();
    expect($emergency->status)->toBe('alta')
        ->and($emergency->discharged_at)->not->toBeNull()
        ->and($emergency->occupied_cubicle_id)->toBeNull();

    $discharge = Discharge::first();
    expect($discharge->emergency_id)->toBe($emergency->id)
        ->and($discharge->turn_id)->toBeNull()
        ->and($discharge->doctor_id)->toBe($this->doctor->id)
        ->and($discharge->discharge_diagnosis)->toBe('Crisis asmática resuelta.');

    expect(Account::find($emergency->account_id)->status)->toBe('pendiente_facturar');
});

test('a transfer needs the destination and the discharge happens once', function () {
    $this->actingAs($this->medico)
        ->post("/emergencia/{$this->emergency->id}/alta", ['type' => 'traslado', 'discharge_diagnosis' => 'IAM'])
        ->assertSessionHasErrors(['destination']);

    $this->actingAs($this->medico)->post("/emergencia/{$this->emergency->id}/alta", [
        'type' => 'traslado', 'destination' => 'Hospital Cabral y Báez', 'discharge_diagnosis' => 'IAM',
    ])->assertSessionHasNoErrors();

    $this->actingAs($this->medico)
        ->post("/emergencia/{$this->emergency->id}/alta", ['type' => 'recuperado', 'discharge_diagnosis' => 'x'])
        ->assertSessionHasErrors(['emergency']);
    expect(Discharge::count())->toBe(1);
});

test('only a doctor gives the discharge', function () {
    $this->actingAs($this->enfermera)
        ->post("/emergencia/{$this->emergency->id}/alta", ['type' => 'recuperado', 'discharge_diagnosis' => 'x'])
        ->assertForbidden();

    $this->actingAs($this->enfermera)
        ->get("/emergencia/{$this->emergency->id}")
        ->assertInertia(fn ($page) => $page->where('can_discharge', false));
    $this->actingAs($this->medico)
        ->get("/emergencia/{$this->emergency->id}")
        ->assertInertia(fn ($page) => $page->where('can_discharge', true)->has('free_cubicles', 6));
});

test('the patient can be moved to another free cubicle', function () {
    $cub3 = EmergencyCubicle::where('name', 'Cub. 3')->first();

    $this->actingAs($this->enfermera)
        ->patch("/emergencia/{$this->emergency->id}/cubiculo", ['cubicle_id' => $cub3->id])
        ->assertSessionHasNoErrors();

    expect($this->emergency->fresh()->cubicle_id)->toBe($cub3->id)
        ->and($this->emergency->fresh()->occupied_cubicle_id)->toBe($cub3->id);

    // Cub. 1 is free again; an occupied cubicle cannot be taken
    $other = Patient::factory()->create();
    $this->actingAs($this->enfermera)->post('/emergencia/ingreso', [
        'patient_id' => $other->id,
        'cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id'),
        'doctor_id' => $this->doctor->id,
        'reason' => 'Fiebre.',
    ])->assertSessionHasNoErrors();

    $this->actingAs($this->enfermera)
        ->patch("/emergencia/{$this->emergency->id}/cubiculo", ['cubicle_id' => EmergencyCubicle::where('name', 'Cub. 1')->value('id')])
        ->assertSessionHasErrors(['cubicle_id']);
});

test('the emergency discharges migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_03_400000_add_emergency_id_to_discharges_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasColumn('discharges', 'emergency_id'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasColumn('discharges', 'emergency_id'))->toBeTrue();
});
