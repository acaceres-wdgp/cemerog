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

test('cuentas por cobrar lists every invoice with a balance, oldest first, with days and the patient contact', function () {
    $recent = issuedInvoice($this->cajero, 200000);
    payOnCredit($this->cajero, $recent, 50000, today()->addWeek()->toDateString());

    $old = issuedInvoice($this->cajero, 100000);
    payOnCredit($this->cajero, $old, 0, today()->toDateString());
    $old->update(['issued_at' => now()->subDays(95), 'credit_due_date' => today()->subDays(60)]);
    $old->patient->update(['phone' => '809-222-3367']);

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
            ->where('invoices.0.number', $old->number)
            ->where('invoices.0.days', 95)
            ->where('invoices.0.total', 100000)
            ->where('invoices.0.paid_amount', 0)
            ->where('invoices.0.balance', 100000)
            ->where('invoices.0.overdue', true)
            ->where('invoices.0.patient.full_name', $old->patient->full_name)
            ->where('invoices.0.patient.document_number', $old->patient->document_number)
            ->where('invoices.0.patient.phone', '809-222-3367')
            ->where('invoices.1.number', $recent->number)
            ->where('invoices.1.days', 0)
            ->where('invoices.1.balance', 150000)
            ->where('invoices.1.overdue', false)
        );
});

test('a payment flashes its receipt so it can be printed right away', function () {
    $invoice = issuedInvoice($this->cajero, 200000);
    payOnCredit($this->cajero, $invoice, 0, today()->addWeek()->toDateString());

    $this->actingAs($this->cajero)
        ->from('/cuentas-por-cobrar')
        ->post("/facturacion/facturas/{$invoice->id}/pagos", [
            'payments' => [['method' => 'efectivo', 'amount' => 50000]],
        ])
        ->assertRedirect('/cuentas-por-cobrar')
        ->assertSessionHas('inertia.flash_data.receipt');

    $receipt = $invoice->receipts()->latest('id')->first();
    expect(session('inertia.flash_data.receipt'))->toBe(['id' => $receipt->id, 'number' => $receipt->number]);
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
