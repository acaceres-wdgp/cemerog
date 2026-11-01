<?php

use App\Actions\BuildClinicalHistory;
use App\Actions\Emergencia\AdmitToEmergency;
use App\Models\Doctor;
use App\Models\EmergencyCubicle;
use App\Models\ImagingOrder;
use App\Models\ImagingStudy;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\Turn;
use App\Models\User;
use Database\Seeders\ImagingCatalogSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    $this->seed(ImagingCatalogSeeder::class);
    $this->tecnico = User::factory()->create(['name' => 'Lic. Ramírez']);
    $this->tecnico->assignRole('imagenes');
    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'user_id' => $this->medico->id, 'specialty_id' => Specialty::factory()->create()->id, 'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();
    $this->turn = Turn::factory()->create([
        'doctor_id' => $this->doctor->id, 'patient_id' => $this->patient->id, 'status' => 'en_consulta', 'arrived_at' => now(),
    ]);
    $this->actingAs($this->medico)->post("/consulta/turnos/{$this->turn->id}/estudios", [
        'imaging_study_ids' => [ImagingStudy::where('code', 'I-01')->value('id')],
    ]);
    $this->order = ImagingOrder::first();
});

function signReport($test): void
{
    $id = $test->order->id;
    $test->actingAs($test->tecnico)->post("/imagenes/ordenes/{$id}/realizado");
    $test->actingAs($test->tecnico)->post("/imagenes/ordenes/{$id}/adjuntos", ['files' => [UploadedFile::fake()->image('torax.jpg')]]);
    $test->actingAs($test->tecnico)->post("/imagenes/ordenes/{$id}/firmar", [
        'findings' => 'Campos pulmonares sin infiltrados.',
        'conclusion' => 'Tórax sin alteraciones.',
    ]);
}

test('consulta shows the imaging orders and, once signed, the report', function () {
    $this->actingAs($this->medico)
        ->get("/consulta?patient_id={$this->patient->id}")
        ->assertInertia(fn ($page) => $page
            ->has('imaging_orders', 1)
            ->where('imaging_orders.0.number', 'I-0001')
            ->where('imaging_orders.0.status', 'ordenada')
            ->where('imaging_orders.0.report', null)
        );

    signReport($this);

    $this->actingAs($this->medico)
        ->get("/consulta?patient_id={$this->patient->id}")
        ->assertInertia(fn ($page) => $page
            ->where('imaging_orders.0.status', 'listo')
            ->where('imaging_orders.0.report.conclusion', 'Tórax sin alteraciones.')
            ->where('imaging_orders.0.report.signed_by', 'Lic. Ramírez')
            ->where('imaging_orders.0.report.attachments.0.name', 'torax.jpg')
        );
});

test('emergencia shows the imaging orders of the attention', function () {
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');
    $emergency = app(AdmitToEmergency::class)->handle(
        $this->patient, null, EmergencyCubicle::value('id'), $this->doctor->id, 'Caída', $enfermera,
    );
    $this->actingAs($enfermera)->post("/emergencia/{$emergency->id}/estudios", [
        'imaging_study_ids' => [ImagingStudy::where('code', 'I-05')->value('id')],
    ]);

    $this->actingAs($enfermera)
        ->get("/emergencia/{$emergency->id}")
        ->assertInertia(fn ($page) => $page
            ->has('imaging_orders', 1)
            ->where('imaging_orders.0.name', 'Radiografía de extremidades')
        );
});

test('signed reports are part of the clinical history; pending ones are not', function () {
    expect(collect(app(BuildClinicalHistory::class)->handle($this->patient, $this->doctor))->where('type', 'imagen'))->toHaveCount(0);

    signReport($this);

    $entry = collect(app(BuildClinicalHistory::class)->handle($this->patient, $this->doctor))->firstWhere('type', 'imagen');
    expect($entry)->not->toBeNull()
        ->and($entry['mine'])->toBeTrue()
        ->and($entry['imaging']['name'])->toBe('Radiografía de tórax PA')
        ->and($entry['imaging']['findings'])->toBe('Campos pulmonares sin infiltrados.')
        ->and($entry['imaging']['attachments'])->toHaveCount(1);
});
