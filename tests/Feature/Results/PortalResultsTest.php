<?php

use App\Events\ResultPublished;
use App\Models\ImagingAttachment;
use App\Models\ResultAccessLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

require_once __DIR__.'/helpers.php';

beforeEach(function () {
    $this->caja = portalStaff('caja');
    $this->bioanalista = portalStaff('bioanalista');
    $this->radiologo = portalStaff('imagenes');
    $this->patient = portalPatient();
    $this->account = portalAccount($this->patient, $this->caja, ['consulta']);
    $this->lab = portalLabOrder($this->account, $this->caja);
    $this->xray = portalImagingOrder($this->account, $this->caja);
    $this->code = portalCode($this->account, $this->caja);
});

test('the list shows every study; the ones not validated are «en proceso» without clinical data', function () {
    portalLogin($this->code);

    $this->get('/resultados/mis-resultados')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('portal/resultados')
            ->where('patient.name', 'Rosa María Peña Almonte')
            ->where('patient.expires_on', now()->addDays(90)->format('d/m/Y'))
            ->has('studies', 2)
            ->where('studies.0.key', "lab-{$this->lab->id}")
            ->where('studies.0.name', 'Hemograma completo')
            ->where('studies.0.ready', false)
            ->where('studies.1.kind', 'img')
            ->where('studies.1.ready', false)
            ->missing('studies.0.rows')
        );

    $this->get("/resultados/estudio/lab-{$this->lab->id}")->assertNotFound();
    $this->get("/resultados/estudio/lab-{$this->lab->id}/pdf")->assertNotFound();
});

test('a validated lab study is ready: viewer with flags and a PDF', function () {
    portalValidateLab($this->lab, $this->bioanalista);
    portalLogin($this->code);

    $this->get('/resultados/mis-resultados')
        ->assertInertia(fn ($page) => $page->where('studies.0.ready', true));

    $this->get("/resultados/estudio/lab-{$this->lab->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('portal/estudio')
            ->where('study.validated_by', 'Usuario bioanalista')
            ->where('study.rows.0.test', 'Glóbulos blancos')
            ->where('study.rows.0.value', '11.8')
            ->where('study.rows.0.unit', 'x10³/µL')
            ->where('study.rows.0.reference', '4.5 – 11')
            ->where('study.rows.0.flag', 'A')
            ->where('study.rows.1.flag', 'B')
            ->where('study.rows.2.flag', '')
            ->where('study.verification', $this->lab->order->number."-{$this->lab->id}")
        );

    $pdf = $this->get("/resultados/estudio/lab-{$this->lab->id}/pdf");
    $pdf->assertOk();
    expect($pdf->headers->get('Content-Type'))->toBe('application/pdf')
        ->and(substr($pdf->getContent(), 0, 4))->toBe('%PDF');
});

test('a signed imaging report is ready, with its images to download', function () {
    Storage::fake('local');
    $path = UploadedFile::fake()->image('pa.jpg', 40, 50)->store("imaging/{$this->xray->id}", 'local');
    ImagingAttachment::create(['imaging_order_id' => $this->xray->id, 'path' => $path, 'original_name' => 'Proyección PA.jpg', 'mime' => 'image/jpeg', 'size' => 100, 'uploaded_by' => $this->radiologo->id]);
    ImagingAttachment::create(['imaging_order_id' => $this->xray->id, 'path' => 'imaging/x.dcm', 'original_name' => 'estudio.dcm', 'mime' => 'application/dicom', 'size' => 100, 'uploaded_by' => $this->radiologo->id]);
    portalSignImaging($this->xray, $this->radiologo);
    portalLogin($this->code);

    $this->get("/resultados/estudio/img-{$this->xray->id}")
        ->assertInertia(fn ($page) => $page
            ->where('study.findings', 'Silueta cardíaca de tamaño normal.')
            ->where('study.conclusion', 'Estudio sin alteraciones.')
            // Only images are shown; the DICOM file stays in the clinic
            ->where('study.images', [['n' => 1, 'name' => 'Proyección PA.jpg']])
        );

    $this->get("/resultados/estudio/img-{$this->xray->id}/imagen/1")
        ->assertOk()
        ->assertDownload();
    $this->get("/resultados/estudio/img-{$this->xray->id}/imagen/2")->assertNotFound();
    expect(substr($this->get("/resultados/estudio/img-{$this->xray->id}/pdf")->getContent(), 0, 4))->toBe('%PDF');
});

test('«todos» downloads the ready studies in a single PDF', function () {
    $this->get('/resultados/todos.pdf')->assertRedirect('/resultados');
    portalLogin($this->code);
    $this->get('/resultados/todos.pdf')->assertNotFound();

    portalValidateLab($this->lab, $this->bioanalista);
    portalSignImaging($this->xray, $this->radiologo);

    $response = $this->get('/resultados/todos.pdf');
    $response->assertOk();
    expect(substr($response->getContent(), 0, 4))->toBe('%PDF');
});

test('a study of another account is not found', function () {
    $other = portalAccount(portalPatient(), $this->caja, ['consulta']);
    $foreignLab = portalLabOrder($other, $this->caja);
    portalValidateLab($foreignLab, $this->bioanalista);
    $foreignXray = portalImagingOrder($other, $this->caja);
    portalSignImaging($foreignXray, $this->radiologo);
    portalLogin($this->code);

    $this->get("/resultados/estudio/lab-{$foreignLab->id}")->assertNotFound();
    $this->get("/resultados/estudio/lab-{$foreignLab->id}/pdf")->assertNotFound();
    $this->get("/resultados/estudio/img-{$foreignXray->id}/pdf")->assertNotFound();
    $this->get("/resultados/estudio/img-{$foreignXray->id}/imagen/1")->assertNotFound();
    $this->get('/resultados/mis-resultados')->assertInertia(fn ($page) => $page->has('studies', 2));
});

test('every access and download is logged', function () {
    portalValidateLab($this->lab, $this->bioanalista);
    portalLogin($this->code);
    $this->get("/resultados/estudio/lab-{$this->lab->id}");
    $this->get("/resultados/estudio/lab-{$this->lab->id}/pdf");
    $this->get('/resultados/todos.pdf');

    $logs = ResultAccessLog::orderBy('id')->get();
    expect($logs->pluck('event')->all())->toBe(['login_ok', 'view', 'download_pdf', 'download_all'])
        ->and($logs->pluck('result_access_code_id')->unique()->count())->toBe(1)
        ->and($logs[1]->meta)->toBe(['study' => "lab-{$this->lab->id}"])
        ->and($logs[0]->ip)->toBe('127.0.0.1');
    expect(fn () => $logs[0]->delete())->toThrow(LogicException::class);
});

test('validating a lab order or signing a report publishes the result', function () {
    Event::fake([ResultPublished::class]);
    $order = $this->lab->order;
    $order->update(['status' => 'ingresado']);

    $values = $this->lab->results->mapWithKeys(fn ($r) => [$r->id => $r->name === 'Aspecto' ? 'Claro' : '10'])->all();
    $this->actingAs($this->bioanalista)
        ->post("/laboratorio/ordenes/{$order->id}/validar", ['results' => $values])
        ->assertSessionHasNoErrors();
    Event::assertDispatched(ResultPublished::class, fn (ResultPublished $e) => $e->study->is($order));

    $this->xray->update(['status' => 'realizado']);
    $this->actingAs($this->radiologo)
        ->post("/imagenes/ordenes/{$this->xray->id}/firmar", ['findings' => 'Normal.', 'conclusion' => 'Sin hallazgos.'])
        ->assertSessionHasNoErrors();
    Event::assertDispatched(ResultPublished::class, fn (ResultPublished $e) => $e->study->is($this->xray));
});
