<?php

use App\Actions\Img\CreateImagingOrders;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\ImagingAttachment;
use App\Models\ImagingOrder;
use App\Models\ImagingStudy;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;
use Database\Seeders\ImagingCatalogSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    $this->seed(ImagingCatalogSeeder::class);
    $this->tecnico = User::factory()->create(['name' => 'Lic. Ramírez']);
    $this->tecnico->assignRole('imagenes');
    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
    $this->doctor = Doctor::factory()->create([
        'name' => 'Dr. Franklin Rodríguez',
        'user_id' => $this->medico->id,
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();
    $study = ImagingStudy::where('code', 'I-02')->first();
    [$this->order] = app(CreateImagingOrders::class)->handle(
        $this->patient, 'consulta', ['doctor_id' => $this->doctor->id], [$study->id], 'Dolor en hipocondrio derecho.', $this->medico,
    );
});

function performed(ImagingOrder $order, User $user): ImagingOrder
{
    test()->actingAs($user)->post("/imagenes/ordenes/{$order->id}/realizado")->assertSessionHasNoErrors();

    return $order->fresh();
}

test('the queue lists the studies with counts, pending first', function () {
    $this->actingAs($this->tecnico)
        ->get('/imagenes')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('img/index')
            ->has('orders', 1)
            ->where('orders.0.number', 'I-0001')
            ->where('orders.0.name', 'Sonografía abdominal')
            ->where('orders.0.origin', 'Consulta')
            ->where('orders.0.doctor', 'Dr. Franklin Rodríguez')
            ->where('orders.0.patient.full_name', $this->patient->full_name)
            ->where('counts.ordenada', 1)
            ->where('pending', 1)
        );

    $this->actingAs($this->tecnico)
        ->get('/imagenes?estado=listo')
        ->assertInertia(fn ($page) => $page->has('orders', 0)->where('counts.ordenada', 1));
});

test('marking the study as performed charges it to the account of the day', function () {
    $order = performed($this->order, $this->tecnico);

    $charge = AccountCharge::firstOrFail();
    expect($order->status)->toBe('realizado')
        ->and($order->performed_by)->toBe($this->tecnico->id)
        ->and($order->account_charge_id)->toBe($charge->id)
        ->and($charge->type)->toBe('imagen')
        ->and($charge->description)->toBe('Sonografía abdominal')
        ->and($charge->total)->toBe(150000)
        ->and($charge->account_id)->toBe(Account::where('patient_id', $this->patient->id)->value('id'));

    // Only once
    $this->actingAs($this->tecnico)->post("/imagenes/ordenes/{$order->id}/realizado")->assertSessionHasErrors('order');
    expect(AccountCharge::count())->toBe(1);
});

test('the report is drafted after the study is performed and signed by imaging', function () {
    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$this->order->id}/informe", ['findings' => 'Hígado normal.'])
        ->assertSessionHasErrors('order');

    $order = performed($this->order, $this->tecnico);
    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$order->id}/informe", ['findings' => 'Hígado de tamaño normal.'])
        ->assertSessionHasNoErrors();
    expect($order->fresh()->status)->toBe('borrador');

    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$order->id}/firmar", ['findings' => 'Hígado de tamaño normal.', 'conclusion' => ''])
        ->assertSessionHasErrors('report');

    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$order->id}/firmar", [
            'findings' => 'Hígado de tamaño normal. Vesícula sin litos.',
            'conclusion' => 'Estudio sin alteraciones.',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast.message', 'Informe I-0001 firmado. Enviado a Dr. Franklin Rodríguez.');

    $order->refresh();
    expect($order->status)->toBe('listo')
        ->and($order->signed_by)->toBe($this->tecnico->id)
        ->and($order->conclusion)->toBe('Estudio sin alteraciones.');

    // A signed report is not changed
    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$order->id}/informe", ['findings' => 'Otro.'])
        ->assertSessionHasErrors('order');
});

test('a doctor can draft but not sign; a signed report is delivered', function () {
    $order = performed($this->order, $this->tecnico);
    $report = ['findings' => 'Normal.', 'conclusion' => 'Normal.'];

    $this->actingAs($this->medico)->post("/imagenes/ordenes/{$order->id}/firmar", $report)->assertForbidden();
    $this->actingAs($this->medico)->post("/imagenes/ordenes/{$order->id}/entregar")->assertSessionHasErrors('order');

    $this->actingAs($this->tecnico)->post("/imagenes/ordenes/{$order->id}/firmar", $report);
    $this->actingAs($this->tecnico)->post("/imagenes/ordenes/{$order->id}/entregar")->assertSessionHasNoErrors();

    expect($order->fresh()->status)->toBe('entregado')
        ->and($order->fresh()->delivered_at)->not->toBeNull();
});

test('images and PDFs are attached to the study and served privately', function () {
    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$this->order->id}/adjuntos", ['files' => [UploadedFile::fake()->image('eco.jpg')]])
        ->assertSessionHasErrors('files');

    $order = performed($this->order, $this->tecnico);
    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$order->id}/adjuntos", ['files' => [
            UploadedFile::fake()->image('eco-1.jpg'),
            UploadedFile::fake()->create('informe.pdf', 200, 'application/pdf'),
        ]])
        ->assertSessionHasNoErrors();

    $files = ImagingAttachment::orderBy('id')->get();
    expect($files)->toHaveCount(2)
        ->and($files[0]->original_name)->toBe('eco-1.jpg');
    Storage::disk('local')->assertExists($files[0]->path);

    $this->actingAs($this->medico)->get("/imagenes/adjuntos/{$files[0]->id}")->assertOk();
    $secretaria = User::factory()->create();
    $secretaria->assignRole('secretaria');
    $this->actingAs($secretaria)->get("/imagenes/adjuntos/{$files[0]->id}")->assertForbidden();

    $this->actingAs($this->tecnico)->delete("/imagenes/adjuntos/{$files[1]->id}")->assertSessionHasNoErrors();
    Storage::disk('local')->assertMissing($files[1]->path);

    $this->actingAs($this->tecnico)
        ->post("/imagenes/ordenes/{$order->id}/adjuntos", ['files' => [UploadedFile::fake()->create('virus.exe', 10)]])
        ->assertSessionHasErrors('files.0');
    expect(ImagingAttachment::count())->toBe(1);
});

test('the patient view shows every study of the patient and the selected report', function () {
    $order = performed($this->order, $this->tecnico);

    $this->actingAs($this->tecnico)
        ->get("/imagenes/ordenes/{$order->id}")
        ->assertInertia(fn ($page) => $page
            ->component('img/show')
            ->where('patient.id', $this->patient->id)
            ->has('studies', 1)
            ->where('order.number', 'I-0001')
            ->where('order.indication', 'Dolor en hipocondrio derecho.')
            ->where('order.editable', true)
            ->where('can_sign', true)
        );

    $this->actingAs($this->medico)
        ->get("/imagenes/ordenes/{$order->id}")
        ->assertInertia(fn ($page) => $page->where('can_sign', false));
});

test('an order not performed is cancelled with a reason and is never charged', function () {
    $this->actingAs($this->medico)
        ->post("/imagenes/ordenes/{$this->order->id}/cancelar", ['reason' => ''])
        ->assertSessionHasErrors('reason');

    $this->actingAs($this->medico)
        ->post("/imagenes/ordenes/{$this->order->id}/cancelar", ['reason' => 'Se la hará en otro centro'])
        ->assertSessionHasNoErrors();

    expect($this->order->fresh()->status)->toBe('cancelada')
        ->and($this->order->fresh()->cancel_reason)->toBe('Se la hará en otro centro');
    $this->actingAs($this->tecnico)->post("/imagenes/ordenes/{$this->order->id}/realizado")->assertSessionHasErrors('order');
    expect(AccountCharge::count())->toBe(0);
});

test('the report prints with the patient and the signature', function () {
    $order = performed($this->order, $this->tecnico);
    $this->actingAs($this->tecnico)->post("/imagenes/ordenes/{$order->id}/firmar", ['findings' => 'Normal.', 'conclusion' => 'Sin alteraciones.']);

    $this->actingAs($this->tecnico)
        ->get("/imagenes/ordenes/{$order->id}/imprimir")
        ->assertInertia(fn ($page) => $page
            ->component('img/imprimir')
            ->where('order.conclusion', 'Sin alteraciones.')
            ->where('order.signed_by', 'Lic. Ramírez')
        );
});

test('the imaging attachments migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_06_400000_create_imaging_attachments_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('imaging_attachments'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('imaging_attachments'))->toBeTrue();
});
