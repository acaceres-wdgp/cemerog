<?php

use App\Models\Account;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    // Thursday 26/11/2026, 11:00 in Santo Domingo
    $this->travelTo(Carbon::parse('2026-11-26 15:00:00', 'UTC'));

    $this->rosa = User::factory()->create(['name' => 'Rosa Castillo']);
    $this->rosa->assignRole('caja');
    $this->juan = User::factory()->create(['name' => 'Juan Peña']);
    $this->juan->assignRole('secretaria');
});

/**
 * An invoice with lines of the given charge types (RD$ in centavos).
 *
 * @param  array<int, string>  $types
 */
function listedInvoice(User $by, array $attributes, array $types = ['consulta'], ?Patient $patient = null): Invoice
{
    $patient ??= Patient::factory()->create();
    $account = Account::create([
        'patient_id' => $patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'facturada',
        'opened_at' => now(),
    ]);
    $total = $attributes['total'] ?? 100000;
    $invoice = Invoice::create([
        'number' => 'tmp',
        'account_id' => $account->id,
        'patient_id' => $patient->id,
        'status' => 'pendiente',
        'subtotal' => $total,
        'total' => $total,
        'paid_amount' => 0,
        'issued_by' => $by->id,
        'issued_at' => now(),
        ...$attributes,
    ]);
    $invoice->update(['number' => Invoice::formatNumber($invoice->id)]);
    foreach ($types as $type) {
        InvoiceLine::create([
            'invoice_id' => $invoice->id,
            'type' => $type,
            'description' => ucfirst($type),
            'quantity' => 1,
            'unit_price' => intdiv($total, count($types)),
            'total' => intdiv($total, count($types)),
        ]);
    }

    return $invoice;
}

test('facturas lists this month invoices with area, condition, cashier and the KPIs', function () {
    $ana = Patient::factory()->create(['first_names' => 'Ana', 'last_names' => 'Torres', 'document_number' => '001-1234567-8']);
    listedInvoice($this->rosa, ['total' => 300000, 'paid_amount' => 300000, 'status' => 'pagada'], ['consulta', 'laboratorio'], $ana);
    listedInvoice($this->juan, ['total' => 500000, 'paid_amount' => 200000, 'credit_due_date' => '2026-12-10', 'issued_at' => now()->subDays(3)], ['cirugia', 'habitacion', 'medicamento']);
    listedInvoice($this->rosa, ['total' => 80000, 'status' => 'anulada', 'void_reason' => 'Error', 'voided_by' => $this->rosa->id, 'voided_at' => now(), 'issued_at' => now()->subHour()], ['emergencia']);
    // Last month: not in «Este mes»
    listedInvoice($this->rosa, ['total' => 900000, 'issued_at' => now()->subMonth()]);

    $this->actingAs($this->rosa)
        ->get('/facturas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('facturas/index')
            ->where('filters.periodo', 'mes')
            ->where('period_label', 'Noviembre 2026')
            ->has('invoices.data', 3)
            // Newest first
            ->where('invoices.data.0.patient.full_name', 'Ana Torres')
            ->where('invoices.data.0.patient.document_number', '001-1234567-8')
            ->where('invoices.data.0.area', 'Consulta')
            ->where('invoices.data.0.condition', 'Contado')
            ->where('invoices.data.0.cashier', 'Rosa Castillo')
            ->where('invoices.data.0.issued_time', '11:00 AM')
            ->where('invoices.data.1.area', 'Emergencia')
            // Surgery with room and medication: the surgery is the main area
            ->where('invoices.data.2.area', 'Cirugía')
            ->where('invoices.data.2.condition', 'Crédito')
            ->where('invoices.data.2.balance', 300000)
            ->where('invoices.data.1.status', 'anulada')
            ->where('kpis.billed', 800000)
            ->where('kpis.billed_count', 2)
            ->where('kpis.collected', 500000)
            ->where('kpis.pending', 300000)
            ->where('kpis.pending_count', 1)
            ->where('kpis.voided', 80000)
            ->where('kpis.voided_count', 1)
            ->where('counts', ['todas' => 3, 'pendiente' => 1, 'pagada' => 1, 'anulada' => 1])
            ->where('cashiers', [
                ['id' => $this->juan->id, 'name' => 'Juan Peña'],
                ['id' => $this->rosa->id, 'name' => 'Rosa Castillo'],
            ])
        );
});

test('the invoice area is the main one of the visit', function () {
    listedInvoice($this->rosa, [], ['medicamento', 'laboratorio', 'imagen']);

    $this->actingAs($this->rosa)
        ->get('/facturas')
        ->assertInertia(fn ($page) => $page->where('invoices.data.0.area', 'Imágenes'));
});

test('invoices are filtered by period, state, area, condition and cashier', function () {
    listedInvoice($this->rosa, ['total' => 100000, 'status' => 'pagada', 'paid_amount' => 100000], ['consulta']);
    listedInvoice($this->juan, ['total' => 200000, 'issued_at' => now()->subDays(5), 'credit_due_date' => '2026-12-01'], ['emergencia', 'laboratorio']);
    listedInvoice($this->rosa, ['total' => 400000, 'issued_at' => now()->subDays(20)], ['laboratorio']);
    listedInvoice($this->rosa, ['total' => 700000, 'issued_at' => now()->subMonths(3)], ['consulta']);

    $count = fn (array $query) => $this->actingAs($this->rosa)
        ->get('/facturas?'.http_build_query($query))
        ->viewData('page')['props']['invoices']['total'];

    expect($count(['periodo' => 'hoy']))->toBe(1)
        ->and($count(['periodo' => 'semana']))->toBe(2)
        ->and($count(['periodo' => 'mes']))->toBe(3)
        ->and($count(['periodo' => 'todo']))->toBe(4)
        ->and($count(['periodo' => 'todo', 'estado' => 'pagada']))->toBe(1)
        ->and($count(['periodo' => 'todo', 'estado' => 'pendiente']))->toBe(3)
        ->and($count(['periodo' => 'todo', 'area' => 'Emergencia']))->toBe(1)
        // A lab invoice of an emergency is an «Emergencia» invoice
        ->and($count(['periodo' => 'todo', 'area' => 'Laboratorio']))->toBe(1)
        ->and($count(['periodo' => 'todo', 'condicion' => 'credito']))->toBe(1)
        ->and($count(['periodo' => 'todo', 'condicion' => 'contado']))->toBe(3)
        ->and($count(['periodo' => 'todo', 'cajero' => $this->juan->id]))->toBe(1);
});

test('«hoy» is the clinic day, also for invoices late at night or just after midnight', function () {
    $this->travelTo(Carbon::parse('2026-11-26 23:50:00', 'America/Santo_Domingo'));
    listedInvoice($this->rosa, ['issued_at' => Carbon::parse('2026-11-26 00:10:00', 'America/Santo_Domingo')]);
    listedInvoice($this->rosa, ['issued_at' => Carbon::parse('2026-11-26 21:40:00', 'America/Santo_Domingo')]);
    listedInvoice($this->rosa, ['issued_at' => Carbon::parse('2026-11-25 23:55:00', 'America/Santo_Domingo')]);

    $this->actingAs($this->rosa)
        ->get('/facturas?periodo=hoy')
        ->assertInertia(fn ($page) => $page->where('invoices.total', 2));
});

test('the state tabs count with the other filters but without the state', function () {
    listedInvoice($this->rosa, ['status' => 'pagada', 'paid_amount' => 100000]);
    listedInvoice($this->rosa, []);

    $this->actingAs($this->rosa)
        ->get('/facturas?estado=pagada')
        ->assertInertia(fn ($page) => $page
            ->has('invoices.data', 1)
            ->where('counts.todas', 2)
            ->where('counts.pendiente', 1)
            // The foot sums what is listed
            ->where('totals.billed', 100000)
            ->where('totals.pending', 0)
        );
});

test('invoices are searched by patient name, cédula or invoice number', function () {
    $ana = Patient::factory()->create(['first_names' => 'Ana Lucía', 'last_names' => 'Fermín Reyes', 'document_number' => '031-0567812-4', 'document_type' => 'cedula']);
    $mine = listedInvoice($this->rosa, [], ['consulta'], $ana);
    $other = listedInvoice($this->rosa, []);

    $found = fn (string $q) => collect($this->actingAs($this->rosa)
        ->get('/facturas?'.http_build_query(['periodo' => 'todo', 'q' => $q]))
        ->viewData('page')['props']['invoices']['data'])->pluck('id')->all();

    expect($found('fermín reyes'))->toBe([$mine->id])
        ->and($found('03105678124'))->toBe([$mine->id])
        ->and($found('031-0567812-4'))->toBe([$mine->id])
        ->and($found($other->number))->toBe([$other->id])
        ->and($found((string) $other->id))->toBe([$other->id]);
});

test('invoices are paginated 15 at a time', function () {
    foreach (range(1, 17) as $i) {
        listedInvoice($this->rosa, ['issued_at' => now()->subMinutes($i)]);
    }

    $this->actingAs($this->rosa)
        ->get('/facturas?page=2')
        ->assertInertia(fn ($page) => $page
            ->has('invoices.data', 2)
            ->where('invoices.current_page', 2)
            ->where('invoices.last_page', 2)
            ->where('invoices.from', 16)
            ->where('invoices.to', 17)
            ->where('invoices.total', 17)
        );
});

test('a selected invoice comes with its detail', function () {
    $invoice = listedInvoice($this->rosa, ['total' => 250000], ['consulta', 'laboratorio']);

    $this->actingAs($this->rosa)
        ->get("/facturas?factura={$invoice->id}")
        ->assertInertia(fn ($page) => $page
            ->where('selected_invoice.id', $invoice->id)
            ->where('selected_invoice.area', 'Consulta')
            ->has('selected_invoice.lines', 2)
            ->where('selected_invoice.issued_by', 'Rosa Castillo')
        );
});

test('facturas uses the same roles as facturación', function () {
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');

    $this->actingAs($enfermera)->get('/facturas')->assertForbidden();
    $this->actingAs($this->juan)->get('/facturas')->assertOk();
});
