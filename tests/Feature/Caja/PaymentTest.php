<?php

use App\Actions\Caja\CashShiftSummary;
use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\CashShift;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Receipt;
use App\Models\Specialty;
use App\Models\User;

beforeEach(function () {
    $this->doctor = Doctor::factory()->create([
        'specialty_id' => Specialty::factory()->create()->id,
        'is_active' => true,
    ]);
    $this->patient = Patient::factory()->create();

    $this->cajero = User::factory()->create(['name' => 'Kenia Marte']);
    $this->cajero->assignRole('secretaria');

    $this->otro = User::factory()->create();
    $this->otro->assignRole('caja');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');

    // An RD$2,000 invoice
    $account = Account::create([
        'patient_id' => $this->patient->id,
        'service_date' => today()->toDateString(),
        'status' => 'pendiente_facturar',
        'opened_at' => now(),
    ]);
    AccountCharge::create([
        'account_id' => $account->id,
        'doctor_id' => $this->doctor->id,
        'created_by' => $this->admin->id,
        'type' => 'consulta',
        'description' => 'Consulta',
        'quantity' => 1,
        'unit_price' => 200000,
        'total' => 200000,
        'doctor_fee' => 100000,
    ]);
    $this->actingAs($this->cajero)->post("/facturacion/cuentas/{$account->id}/facturar");
    $this->invoice = Invoice::first();
});

function openRegister(User $user, int $float = 100000): CashShift
{
    test()->actingAs($user)->post('/caja/turno', ['opening_amount' => $float]);

    return CashShift::current();
}

function pay(User $user, Invoice $invoice, array $payments, ?array $credit = null)
{
    return test()->actingAs($user)->post("/facturacion/facturas/{$invoice->id}/pagos", array_filter([
        'payments' => $payments,
        'credit' => $credit,
    ], fn ($v) => $v !== null));
}

// ─── Paying ───────────────────────────────────────────────────────────────────

test('collecting needs an open shift', function () {
    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 200000]])
        ->assertSessionHasErrors(['shift' => 'Abre un turno de caja para cobrar.']);

    expect(Receipt::count())->toBe(0);
});

test('a cash payment records the change and pays the invoice', function () {
    $shift = openRegister($this->cajero);

    pay($this->cajero, $this->invoice, [
        ['method' => 'efectivo', 'amount' => 200000, 'cash_received' => 250000],
    ])->assertSessionHasNoErrors();

    $receipt = Receipt::first();
    expect($receipt->number)->toBe('R-0001')
        ->and($receipt->cash_shift_id)->toBe($shift->id)
        ->and($receipt->total)->toBe(200000)
        ->and($receipt->payments->first()->change_given)->toBe(50000)
        ->and($this->invoice->fresh()->status)->toBe('pagada')
        ->and($this->invoice->fresh()->balance())->toBe(0);

    // Only the RD$2,000 stays in the drawer, not the RD$2,500 handed over
    expect(app(CashShiftSummary::class)->handle($shift)['expected_cash'])->toBe(300000);
});

test('cash received below the amount is rejected', function () {
    openRegister($this->cajero);

    pay($this->cajero, $this->invoice, [
        ['method' => 'efectivo', 'amount' => 200000, 'cash_received' => 150000],
    ])->assertSessionHasErrors(['payments.0.cash_received']);
});

test('a transfer needs its number; a card approval code is optional', function () {
    openRegister($this->cajero);

    pay($this->cajero, $this->invoice, [['method' => 'transferencia', 'amount' => 200000]])
        ->assertSessionHasErrors(['payments.0.reference' => 'Indica el número de la transferencia.']);

    pay($this->cajero, $this->invoice, [['method' => 'tarjeta', 'amount' => 200000]])
        ->assertSessionHasNoErrors();

    expect($this->invoice->fresh()->status)->toBe('pagada');
});

test('a mixed payment goes in one receipt and each method counts apart in the shift', function () {
    $shift = openRegister($this->cajero);

    pay($this->cajero, $this->invoice, [
        ['method' => 'efectivo', 'amount' => 50000],
        ['method' => 'tarjeta', 'amount' => 100000, 'reference' => '483920'],
        ['method' => 'transferencia', 'amount' => 50000, 'reference' => 'TRX-77812'],
    ])->assertSessionHasNoErrors();

    expect(Receipt::count())->toBe(1)
        ->and(Receipt::first()->payments)->toHaveCount(3);

    $summary = app(CashShiftSummary::class)->handle($shift);
    expect($summary['income'])->toBe(['efectivo' => 50000, 'tarjeta' => 100000, 'transferencia' => 50000])
        ->and($summary['expected_cash'])->toBe(150000);
});

test('paying more than the balance is rejected', function () {
    openRegister($this->cajero);

    pay($this->cajero, $this->invoice, [['method' => 'tarjeta', 'amount' => 250000]])
        ->assertSessionHasErrors(['payments']);
});

test('a partial payment leaves a balance; choosing credit records its due date', function () {
    openRegister($this->cajero);

    // Partial payment without credit: the balance stays, with no due date
    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 50000]])
        ->assertSessionHasNoErrors();
    expect($this->invoice->fresh()->balance())->toBe(150000)
        ->and($this->invoice->fresh()->credit_due_date)->toBeNull();

    // Credit with a past due date is rejected
    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 50000]], [
        'due_date' => today()->subDay()->toDateString(),
    ])->assertSessionHasErrors(['credit.due_date']);

    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 50000]], [
        'due_date' => today()->addDays(15)->toDateString(),
        'note' => 'Paga la quincena',
    ])->assertSessionHasNoErrors();

    $invoice = $this->invoice->fresh();
    expect($invoice->status)->toBe('pendiente')
        ->and($invoice->paid_amount)->toBe(100000)
        ->and($invoice->balance())->toBe(100000)
        ->and($invoice->credit_due_date->toDateString())->toBe(today()->addDays(15)->toDateString())
        ->and($invoice->credit_note)->toBe('Paga la quincena');
});

test('a payment needs an amount or a credit', function () {
    openRegister($this->cajero);

    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 0]])
        ->assertSessionHasErrors(['payments']);
});

test('all on credit creates no receipt and needs no open shift', function () {
    pay($this->cajero, $this->invoice, [], ['due_date' => today()->addWeek()->toDateString()])
        ->assertSessionHasNoErrors();

    expect(Receipt::count())->toBe(0)
        ->and($this->invoice->fresh()->balance())->toBe(200000)
        ->and($this->invoice->fresh()->credit_due_date)->not->toBeNull();
});

test('only the cashier of the shift or an administrator collects', function () {
    openRegister($this->cajero);

    pay($this->otro, $this->invoice, [['method' => 'tarjeta', 'amount' => 200000]])
        ->assertSessionHasErrors(['shift']);

    pay($this->admin, $this->invoice, [['method' => 'tarjeta', 'amount' => 200000]])
        ->assertSessionHasNoErrors();
});

test('a paid or voided invoice cannot take more payments', function () {
    openRegister($this->cajero);
    pay($this->cajero, $this->invoice, [['method' => 'tarjeta', 'amount' => 200000]]);

    pay($this->cajero, $this->invoice, [['method' => 'tarjeta', 'amount' => 1000]])
        ->assertSessionHasErrors(['invoice' => 'La factura ya está pagada.']);
});

// ─── Voiding receipts ─────────────────────────────────────────────────────────

test('an administrator voids a receipt of the open shift and the invoice owes again', function () {
    $shift = openRegister($this->cajero);
    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 200000]]);
    $receipt = Receipt::first();

    $this->actingAs($this->cajero)
        ->post("/facturacion/recibos/{$receipt->id}/anular", ['void_reason' => 'Error'])
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->post("/facturacion/recibos/{$receipt->id}/anular", ['void_reason' => 'Se cobró dos veces'])
        ->assertSessionHasNoErrors();

    expect($receipt->fresh()->voided_at)->not->toBeNull()
        ->and($this->invoice->fresh()->status)->toBe('pendiente')
        ->and($this->invoice->fresh()->paid_amount)->toBe(0)
        ->and(app(CashShiftSummary::class)->handle($shift)['expected_cash'])->toBe(100000);

    // With no payments left, the invoice can now be voided
    $this->actingAs($this->admin)
        ->post("/facturacion/facturas/{$this->invoice->id}/anular", ['void_reason' => 'Error'])
        ->assertSessionHasNoErrors();
});

test('a receipt of a closed shift cannot be voided', function () {
    openRegister($this->cajero, 100000);
    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 200000]]);
    $this->actingAs($this->cajero)->post('/cuadre-de-caja/cerrar', ['counted_cash' => 300000, 'confirmed' => true])
        ->assertSessionHasNoErrors();

    $this->actingAs($this->admin)
        ->post('/facturacion/recibos/'.Receipt::first()->id.'/anular', ['void_reason' => 'Error'])
        ->assertSessionHasErrors(['receipt']);
});

// ─── Pages ────────────────────────────────────────────────────────────────────

test('the invoice detail lists its receipts and the cuadre lists the shift receipts', function () {
    openRegister($this->cajero);
    pay($this->cajero, $this->invoice, [['method' => 'efectivo', 'amount' => 200000, 'cash_received' => 200000]]);

    $this->actingAs($this->cajero)
        ->get("/facturacion?factura={$this->invoice->id}")
        ->assertInertia(fn ($page) => $page
            ->has('selected_invoice.receipts', 1)
            ->where('selected_invoice.receipts.0.number', 'R-0001')
            ->where('selected_invoice.receipts.0.payments.0.method', 'efectivo')
        );

    $this->actingAs($this->cajero)
        ->get('/cuadre-de-caja')
        ->assertInertia(fn ($page) => $page
            ->has('shift.receipts', 1)
            ->where('shift.receipts.0.invoice_number', 'F-0000001')
            ->where('shift.summary.income.efectivo', 200000)
            ->where('shift.summary.expected_cash', 300000)
        );
});

test('the receipt print page renders', function () {
    openRegister($this->cajero);
    pay($this->cajero, $this->invoice, [['method' => 'tarjeta', 'amount' => 200000]]);

    $this->actingAs($this->cajero)
        ->get('/facturacion/recibos/'.Receipt::first()->id.'/imprimir')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('caja/recibo-imprimir')
            ->where('receipt.number', 'R-0001')
            ->where('receipt.invoice.number', 'F-0000001')
        );
});

test('the receipts migration can be rolled back', function () {
    $migration = '2026_11_01_300000_create_receipts_table';

    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('receipts'))->toBeFalse()
        ->and(Schema::hasTable('payments'))->toBeFalse();

    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('receipts'))->toBeTrue();
});
