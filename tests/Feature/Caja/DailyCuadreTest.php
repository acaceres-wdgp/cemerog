<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->kenia = User::factory()->create(['name' => 'Kenia Marte']);
    $this->kenia->assignRole('caja');
    $this->rosa = User::factory()->create(['name' => 'Rosa Castillo']);
    $this->rosa->assignRole('secretaria');
    $this->admin = User::factory()->create(['name' => 'Admin']);
    $this->admin->assignRole('administrador');
});

/** Santo Domingo time of 26/11/2026 */
function atDominican(string $time): void
{
    test()->travelTo(Carbon::parse(str_contains($time, '-') ? $time : "2026-11-26 {$time}", 'America/Santo_Domingo'));
}

function dayInvoice(User $by, int $total): Invoice
{
    $account = Account::create([
        'patient_id' => Patient::factory()->create(['first_names' => 'Ana', 'last_names' => 'Torres'])->id,
        'service_date' => today()->toDateString(),
        'status' => 'pendiente_facturar',
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
    test()->actingAs($by)->post("/facturacion/cuentas/{$account->id}/facturar")->assertSessionHasNoErrors();

    return Invoice::latest('id')->first();
}

function dayPay(User $by, Invoice $invoice, array $payments, ?array $credit = null): void
{
    test()->actingAs($by)
        ->post("/facturacion/facturas/{$invoice->id}/pagos", array_filter(['payments' => $payments, 'credit' => $credit]))
        ->assertSessionHasNoErrors();
}

/**
 * The day: a closed morning shift (cash, a withdrawal, counted cuadrado) and
 * an open afternoon shift (card + transfer, one on credit, one voided); a
 * shift of the day before is not part of it.
 */
function cashDay(): void
{
    atDominican('2026-11-25 09:00');
    test()->actingAs(test()->kenia)->post('/caja/turno', ['opening_amount' => 70000]);
    dayPay(test()->kenia, dayInvoice(test()->kenia, 900000), [['method' => 'efectivo', 'amount' => 900000]]);
    test()->actingAs(test()->kenia)->post('/cuadre-de-caja/cerrar', ['counted_cash' => 970000, 'counted_card' => 0, 'counted_transfer' => 0, 'confirmed' => true]);

    atDominican('08:00');
    test()->actingAs(test()->kenia)->post('/caja/turno', ['opening_amount' => 100000]);
    dayPay(test()->kenia, dayInvoice(test()->kenia, 200000), [['method' => 'efectivo', 'amount' => 200000, 'cash_received' => 200000]]);
    test()->actingAs(test()->kenia)->post('/caja/turno/retiros', ['amount' => 50000, 'reason' => 'Depósito al banco'])->assertSessionHasNoErrors();
    atDominican('12:30');
    test()->actingAs(test()->kenia)
        ->post('/cuadre-de-caja/cerrar', ['counted_cash' => 250000, 'counted_card' => 0, 'counted_transfer' => 0, 'confirmed' => true])
        ->assertSessionHasNoErrors();

    atDominican('14:00');
    test()->actingAs(test()->rosa)->post('/caja/turno', ['opening_amount' => 50000]);
    dayPay(test()->rosa, dayInvoice(test()->rosa, 150000), [
        ['method' => 'tarjeta', 'amount' => 100000],
        ['method' => 'transferencia', 'amount' => 50000, 'reference' => 'TRX-9'],
    ]);
    dayPay(test()->rosa, dayInvoice(test()->rosa, 80000), [], ['due_date' => '2026-12-10']);
    $voided = dayInvoice(test()->rosa, 30000);
    test()->actingAs(test()->admin)
        ->post("/facturacion/facturas/{$voided->id}/anular", ['void_reason' => 'Error'])
        ->assertSessionHasNoErrors();
    atDominican('16:00');
}

test('the cuadre of the day brings every shift of the day with its money and count', function () {
    cashDay();

    $this->actingAs($this->kenia)
        ->get('/cuadre-de-caja/dia?fecha=2026-11-26')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cuadre/reporte-dia')
            ->where('day.date', '26/11/2026')
            ->where('day.label', 'jueves, 26 de noviembre de 2026')
            ->has('day.shifts', 2)
            ->where('day.shifts.0.opened_by', 'Kenia Marte')
            ->where('day.shifts.0.status', 'cerrado')
            ->where('day.shifts.0.summary.opening', 100000)
            ->where('day.shifts.0.summary.income.efectivo', 200000)
            ->where('day.shifts.0.summary.withdrawals', 50000)
            ->where('day.shifts.0.expected_cash', 250000)
            ->where('day.shifts.0.counted_cash', 250000)
            ->where('day.shifts.0.difference', 0)
            ->where('day.shifts.1.opened_by', 'Rosa Castillo')
            ->where('day.shifts.1.status', 'abierto')
            ->where('day.shifts.1.counted_cash', null)
            ->where('day.totals.income', ['efectivo' => 200000, 'tarjeta' => 100000, 'transferencia' => 50000])
            ->where('day.totals.collected', 350000)
            ->where('day.totals.withdrawals', 50000)
            ->where('day.totals.opening', 150000)
            ->where('day.open_shifts', 1)
            ->has('day.receipts', 2)
            ->where('day.receipts.0.shift', 'Mañana')
            ->has('day.withdrawals', 1)
            ->where('day.withdrawals.0.reason', 'Depósito al banco')
            // Billing of the day: what was invoiced, how, and what was voided
            ->where('day.billing.count', 3)
            ->where('day.billing.total', 430000)
            ->where('day.billing.on_credit', 80000)
            ->where('day.billing.voided_count', 1)
            ->where('day.billing.voided_total', 30000)
        );
});

test('the day is the clinic day: a shift opened just after midnight or late at night counts', function () {
    atDominican('00:05');
    $this->actingAs($this->kenia)->post('/caja/turno', ['opening_amount' => 10000]);
    $this->actingAs($this->kenia)->post('/cuadre-de-caja/cerrar', ['counted_cash' => 10000, 'counted_card' => 0, 'counted_transfer' => 0, 'confirmed' => true]);
    atDominican('21:30');
    $this->actingAs($this->rosa)->post('/caja/turno', ['opening_amount' => 20000]);
    atDominican('2026-11-27 00:10');
    $this->actingAs($this->rosa)->post('/cuadre-de-caja/cerrar', ['counted_cash' => 20000, 'counted_card' => 0, 'counted_transfer' => 0, 'confirmed' => true]);
    $this->actingAs($this->kenia)->post('/caja/turno', ['opening_amount' => 30000]);

    $this->actingAs($this->kenia)
        ->get('/cuadre-de-caja/dia?fecha=2026-11-26')
        ->assertInertia(fn ($page) => $page
            ->has('day.shifts', 2)
            ->where('day.totals.opening', 30000)
            ->where('day.shifts.0.label', 'Mañana')
            ->where('day.shifts.1.label', 'Tarde')
        );
    $this->actingAs($this->kenia)
        ->get('/cuadre-de-caja/dia?fecha=2026-11-27')
        ->assertInertia(fn ($page) => $page->has('day.shifts', 1)->where('day.totals.opening', 30000));
});

test('without a date it is today; a day without shifts says so', function () {
    atDominican('10:00');

    $this->actingAs($this->kenia)
        ->get('/cuadre-de-caja/dia')
        ->assertInertia(fn ($page) => $page
            ->where('day.date', '26/11/2026')
            ->has('day.shifts', 0)
            ->where('day.totals.collected', 0)
        );
    $this->actingAs($this->kenia)
        ->get('/cuadre-de-caja/dia?fecha=no-es-fecha')
        ->assertInertia(fn ($page) => $page->where('day.date', '26/11/2026'));
});

test('the cuadre page links to the cuadre of the day of the shift', function () {
    cashDay();

    $this->actingAs($this->kenia)
        ->get('/cuadre-de-caja')
        ->assertInertia(fn ($page) => $page->where('shift.opened_on', '2026-11-26'));
});

test('only who sees the cuadre prints the cuadre of the day', function () {
    $medico = User::factory()->create();
    $medico->assignRole('medico');

    $this->actingAs($medico)->get('/cuadre-de-caja/dia')->assertForbidden();
});
