<?php

use App\Actions\Patients\BuildPatientProfile;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\User;

beforeEach(function () {
    $this->cajero = User::factory()->create();
    $this->cajero->assignRole('caja');
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
    $this->patient = Patient::factory()->create();

    $this->actingAs($this->cajero)->post('/caja/turno', ['opening_amount' => 100000]);
});

function financesInvoice(User $by, Patient $patient, int $total): Invoice
{
    $account = Account::create([
        'patient_id' => $patient->id,
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

/** @param  list<array<string, mixed>>  $payments */
function financesPay(User $by, Invoice $invoice, array $payments): void
{
    test()->actingAs($by)
        ->post("/facturacion/facturas/{$invoice->id}/pagos", ['payments' => $payments])
        ->assertSessionHasNoErrors();
}

test('the finances list the invoices with their balance and every payment received', function () {
    $credit = financesInvoice($this->cajero, $this->patient, 300000);
    financesPay($this->cajero, $credit, [['method' => 'efectivo', 'amount' => 100000]]);
    financesPay($this->cajero, $credit, [['method' => 'tarjeta', 'amount' => 50000]]);

    $cash = financesInvoice($this->cajero, $this->patient, 80000);
    financesPay($this->cajero, $cash, [['method' => 'transferencia', 'amount' => 80000, 'reference' => 'TRX-9']]);

    $finanzas = app(BuildPatientProfile::class)->handle($this->patient, $this->admin)['finanzas'];

    expect($finanzas['facturas'])->toHaveCount(2)
        ->and($finanzas['facturas'][0])->toMatchArray([
            'number' => $cash->number, 'total' => 80000, 'paid_amount' => 80000, 'balance' => 0, 'status' => 'pagada',
        ])
        ->and($finanzas['facturas'][1])->toMatchArray([
            'id' => $credit->id, 'number' => $credit->number, 'total' => 300000, 'paid_amount' => 150000, 'balance' => 150000,
        ])
        ->and($finanzas['total_facturado'])->toBe(380000)
        ->and($finanzas['total_pagado'])->toBe(230000)
        ->and($finanzas['saldo'])->toBe(150000)
        ->and($finanzas['pagos'])->toHaveCount(3)
        // Newest first
        ->and($finanzas['pagos'][0])->toMatchArray([
            'invoice_number' => $cash->number, 'methods' => 'Transferencia', 'amount' => 80000, 'kind' => 'Pago total', 'voided' => false,
        ])
        ->and($finanzas['pagos'][1])->toMatchArray(['methods' => 'Tarjeta', 'amount' => 50000, 'kind' => 'Abono parcial'])
        ->and($finanzas['pagos'][2])->toMatchArray(['methods' => 'Efectivo', 'amount' => 100000, 'kind' => 'Abono parcial']);
});

test('the payment that settles an invoice after installments is a liquidation', function () {
    $invoice = financesInvoice($this->cajero, $this->patient, 200000);
    financesPay($this->cajero, $invoice, [['method' => 'efectivo', 'amount' => 50000]]);
    financesPay($this->cajero, $invoice, [
        ['method' => 'efectivo', 'amount' => 100000],
        ['method' => 'tarjeta', 'amount' => 50000],
    ]);

    $pagos = app(BuildPatientProfile::class)->handle($this->patient, $this->admin)['finanzas']['pagos'];

    expect($pagos[0])->toMatchArray(['methods' => 'Efectivo + Tarjeta', 'amount' => 150000, 'kind' => 'Liquidación']);
});

test('a voided receipt shows as voided and does not count as paid', function () {
    $invoice = financesInvoice($this->cajero, $this->patient, 200000);
    financesPay($this->cajero, $invoice, [['method' => 'efectivo', 'amount' => 50000]]);
    $receipt = $invoice->receipts()->first();

    $this->actingAs($this->admin)
        ->post("/facturacion/recibos/{$receipt->id}/anular", ['void_reason' => 'Error de monto'])
        ->assertSessionHasNoErrors();

    $finanzas = app(BuildPatientProfile::class)->handle($this->patient, $this->admin)['finanzas'];

    expect($finanzas['pagos'][0])->toMatchArray(['voided' => true, 'kind' => 'Anulado'])
        ->and($finanzas['total_pagado'])->toBe(0)
        ->and($finanzas['facturas'][0]['balance'])->toBe(200000);
});
