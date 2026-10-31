<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\CashShift;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\User;

beforeEach(function () {
    $this->cajero = User::factory()->create(['name' => 'Rosa Castillo']);
    $this->cajero->assignRole('secretaria');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');

    $this->actingAs($this->cajero)->post('/caja/turno', ['opening_amount' => 100000]);
});

/** Issue an RD$ invoice for a new patient */
function issuedInvoice(User $by, int $total): Invoice
{
    $account = Account::create([
        'patient_id' => Patient::factory()->create()->id,
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
    test()->actingAs($by)->post("/facturacion/cuentas/{$account->id}/facturar");

    return Invoice::latest('id')->first();
}

function payOnCredit(User $by, Invoice $invoice, int $amount, string $due): void
{
    test()->actingAs($by)
        ->post("/facturacion/facturas/{$invoice->id}/pagos", [
            'payments' => $amount > 0 ? [['method' => 'efectivo', 'amount' => $amount]] : [],
            'credit' => ['due_date' => $due],
        ])
        ->assertSessionHasNoErrors();
}

test('cuentas por cobrar lists invoices with a balance, totals and overdue ones', function () {
    $current = issuedInvoice($this->cajero, 200000);
    payOnCredit($this->cajero, $current, 50000, today()->addWeek()->toDateString());

    $overdue = issuedInvoice($this->cajero, 100000);
    payOnCredit($this->cajero, $overdue, 0, today()->toDateString());
    $overdue->update(['credit_due_date' => today()->subDays(3)]);

    $paid = issuedInvoice($this->cajero, 80000);
    $this->actingAs($this->cajero)->post("/facturacion/facturas/{$paid->id}/pagos", [
        'payments' => [['method' => 'tarjeta', 'amount' => 80000]],
    ]);

    $this->actingAs($this->cajero)
        ->get('/cuentas-por-cobrar')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cxc/index')
            ->has('invoices', 2)
            ->where('totals.receivable', 250000)
            ->where('totals.overdue', 100000)
            ->where('totals.overdue_count', 1)
            ->where('invoices.0.number', $overdue->number)
            ->where('invoices.0.overdue', true)
        );

    $this->actingAs($this->cajero)
        ->get('/cuentas-por-cobrar?filtro=vencidas')
        ->assertInertia(fn ($page) => $page->has('invoices', 1)->where('filter', 'vencidas'));

    $this->actingAs($this->cajero)
        ->get('/cuentas-por-cobrar?filtro=al_dia')
        ->assertInertia(fn ($page) => $page->has('invoices', 1)->where('invoices.0.number', $current->number));
});

test('a later installment keeps the credit due date and pays off the invoice', function () {
    $invoice = issuedInvoice($this->cajero, 200000);
    $due = today()->addDays(10)->toDateString();
    payOnCredit($this->cajero, $invoice, 50000, $due);

    // Second installment, still partial, without sending a new due date
    $this->actingAs($this->cajero)
        ->post("/facturacion/facturas/{$invoice->id}/pagos", [
            'payments' => [['method' => 'transferencia', 'amount' => 100000, 'reference' => 'TRX-1']],
        ])
        ->assertSessionHasNoErrors();
    expect($invoice->fresh()->credit_due_date->toDateString())->toBe($due)
        ->and($invoice->fresh()->balance())->toBe(50000);

    // Last installment
    $this->actingAs($this->cajero)
        ->post("/facturacion/facturas/{$invoice->id}/pagos", [
            'payments' => [['method' => 'efectivo', 'amount' => 50000]],
        ])
        ->assertSessionHasNoErrors();
    expect($invoice->fresh()->status)->toBe('pagada')
        ->and($invoice->fresh()->receipts)->toHaveCount(3);
});

test('an installment on an overdue invoice keeps its past due date', function () {
    $invoice = issuedInvoice($this->cajero, 200000);
    payOnCredit($this->cajero, $invoice, 0, today()->toDateString());
    $invoice->update(['credit_due_date' => today()->subDays(5)]);

    $this->actingAs($this->cajero)
        ->post("/facturacion/facturas/{$invoice->id}/pagos", [
            'payments' => [['method' => 'efectivo', 'amount' => 50000]],
            'credit' => ['due_date' => today()->subDays(5)->toDateString()],
        ])
        ->assertSessionHasNoErrors();

    expect($invoice->fresh()->balance())->toBe(150000)
        ->and($invoice->fresh()->credit_due_date->toDateString())->toBe(today()->subDays(5)->toDateString());
});

test('the receivable detail can be opened from cuentas por cobrar', function () {
    $invoice = issuedInvoice($this->cajero, 200000);
    payOnCredit($this->cajero, $invoice, 0, today()->addWeek()->toDateString());

    $this->actingAs($this->cajero)
        ->get("/cuentas-por-cobrar?factura={$invoice->id}")
        ->assertInertia(fn ($page) => $page
            ->where('selected_invoice.number', $invoice->number)
            ->where('selected_invoice.balance', 200000)
        );
});

test('doctors cannot see accounts receivable', function () {
    $medico = User::factory()->create();
    $medico->assignRole('medico');

    $this->actingAs($medico)->get('/cuentas-por-cobrar')->assertForbidden();
});

test('the shift report shows the float, receipts, withdrawals and the count', function () {
    $invoice = issuedInvoice($this->cajero, 200000);
    $this->actingAs($this->cajero)->post("/facturacion/facturas/{$invoice->id}/pagos", [
        'payments' => [
            ['method' => 'efectivo', 'amount' => 150000],
            ['method' => 'tarjeta', 'amount' => 50000],
        ],
    ]);
    $this->actingAs($this->cajero)->post('/caja/turno/retiros', ['amount' => 20000, 'reason' => 'Gasto menor']);
    $this->actingAs($this->cajero)->post('/cuadre-de-caja/cerrar', [
        'counted_cash' => 230000,
        'confirmed' => true,
    ])->assertSessionHasNoErrors();

    $shift = CashShift::latest('id')->first();

    $this->actingAs($this->cajero)
        ->get("/cuadre-de-caja/turnos/{$shift->id}/reporte")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cuadre/reporte')
            ->where('shift.status', 'cerrado')
            ->where('shift.summary.opening', 100000)
            ->where('shift.summary.income.efectivo', 150000)
            ->where('shift.summary.income.tarjeta', 50000)
            ->where('shift.summary.withdrawals', 20000)
            ->where('shift.expected_cash', 230000)
            ->where('shift.difference', 0)
            ->has('shift.receipts', 1)
            ->has('shift.withdrawals', 1)
        );
});
