<?php

use App\Actions\Emergencia\AdmitToEmergency;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\EmergencyCubicle;
use App\Models\ImagingOrder;
use App\Models\ImagingStudy;
use App\Models\LabOrder;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Database\Seeders\ImagingCatalogSeeder;
use Database\Seeders\LabCatalogSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->seed([LabCatalogSeeder::class, ImagingCatalogSeeder::class]);
    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'user_id' => $this->medico->id,
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();
    $this->turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id,
        'patient_id' => $this->patient->id,
        'status' => 'en_consulta',
        'arrived_at' => now(),
    ]);
    $this->torax = ImagingStudy::where('code', 'I-01')->first();
    $this->abdominal = ImagingStudy::where('code', 'I-02')->first();
    $this->glucosa = LabTest::where('code', '130')->first();
});

test('the doctor orders analyses and imaging together from consulta; nothing is charged', function () {
    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$this->turn->id}/estudios", [
            'lab_test_ids' => [$this->glucosa->id],
            'imaging_study_ids' => [$this->torax->id, $this->abdominal->id],
            'indication' => 'Dolor abdominal y tos.',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast.message', 'Órdenes L-0001, I-0001 e I-0002 enviadas.');

    $orders = ImagingOrder::orderBy('id')->get();
    expect(LabOrder::count())->toBe(1)
        ->and($orders)->toHaveCount(2)
        ->and($orders[0]->number)->toBe('I-0001')
        ->and($orders[0]->name)->toBe('Radiografía de tórax PA')
        ->and($orders[0]->modality)->toBe('Radiografía')
        ->and($orders[0]->price)->toBe(80000)
        ->and($orders[0]->origin)->toBe('consulta')
        ->and($orders[0]->turn_id)->toBe($this->turn->id)
        ->and($orders[0]->doctor_id)->toBe($this->doctor->id)
        ->and($orders[0]->status)->toBe('ordenada')
        ->and($orders[1]->indication)->toBe('Dolor abdominal y tos.')
        ->and(AccountCharge::count())->toBe(0);
});

test('only imaging can be ordered, also from emergency', function () {
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');
    $emergency = app(AdmitToEmergency::class)->handle(
        $this->patient, null, EmergencyCubicle::value('id'), $this->doctor->id, 'Caída', $enfermera,
    );

    $this->actingAs($enfermera)
        ->post("/emergencia/{$emergency->id}/estudios", ['imaging_study_ids' => [$this->torax->id]])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast.message', 'Orden I-0001 enviada.');

    expect(LabOrder::count())->toBe(0)
        ->and(ImagingOrder::first()->origin)->toBe('emergencia')
        ->and(ImagingOrder::first()->emergency_id)->toBe($emergency->id);
});

test('an order needs at least one active analysis or study', function () {
    $this->torax->update(['is_active' => false]);

    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$this->turn->id}/estudios", ['lab_test_ids' => [], 'imaging_study_ids' => []])
        ->assertSessionHasErrors(['lab_test_ids']);
    $this->actingAs($this->medico)
        ->post("/consulta/turnos/{$this->turn->id}/estudios", ['imaging_study_ids' => [$this->torax->id]])
        ->assertSessionHasErrors(['imaging_study_ids.0']);

    expect(ImagingOrder::count())->toBe(0);
});

test('consulta and emergencia offer the active imaging catalog', function () {
    $this->abdominal->update(['is_active' => false]);

    $this->actingAs($this->medico)
        ->get('/consulta')
        ->assertInertia(fn ($page) => $page
            ->has('imaging_catalog', 4)
            ->where('imaging_catalog.0.code', 'I-01')
            ->where('imaging_catalog.0.modality', 'Radiografía')
        );
});

test('the imaging orders migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_06_300000_create_imaging_orders_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('imaging_orders'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('imaging_orders'))->toBeTrue();
});
