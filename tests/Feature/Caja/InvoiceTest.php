<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Doctor;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Specialty;
use App\Models\User;

beforeEach(function () {
    $this->specialty = Specialty::factory()->create(['name' => 'Medicina General']);
    $this->doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'is_active' => true]);
    $this->patient = Patient::factory()->create();

    $this->secretaria = User::factory()->create();
    $this->secretaria->assignRole('secretaria');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');

    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
});

/** A daily account with a consultation (RD$1,500, fee RD$1,000) and a lab charge (RD$500) */
function billableAccount(Patient $patient, Doctor $doctor, User $by, string $status = 'pendiente_facturar'): Account
{
    $account = Account::create([
        'patient_id' => $patient->id,
        'service_date' => today()->toDateString(),
        'status' => $status,
        'opened_at' => now(),
    ]);
    AccountCharge::create([
        'account_id' => $account->id,
        'doctor_id' => $doctor->id,
        'created_by' => $by->id,
        'type' => 'consulta',
        'description' => 'Consulta – '.$doctor->name,
        'quantity' => 1,
        'unit_price' => 150000,
        'total' => 150000,
        'doctor_fee' => 100000,
    ]);
    AccountCharge::create([
        'account_id' => $account->id,
        'created_by' => $by->id,
        'type' => 'laboratorio',
        'description' => 'Hemograma',
        'quantity' => 1,
        'unit_price' => 50000,
        'total' => 50000,
    ]);

    return $account;
}

function invoiceAccount(User $user, Account $account, array $data = []): Invoice
{
    test()->actingAs($user)
        ->post("/facturacion/cuentas/{$account->id}/facturar", $data)
        ->assertSessionHasNoErrors();

    return Invoice::latest('id')->first();
}

// ─── Issuing ──────────────────────────────────────────────────────────────────

test('issuing an invoice copies every charge of the account into a single invoice', function () {
    $account = billableAccount($this->patient, $this->doctor, $this->admin);

    $this->actingAs($this->secretaria)
        ->post("/facturacion/cuentas/{$account->id}/facturar")
        ->assertRedirect(route('caja', ['factura' => Invoice::first()?->id ?? 1]));

    $invoice = Invoice::first();
    expect($invoice->number)->toBe('F-0000001')
        ->and($invoice->status)->toBe('pendiente')
        ->and($invoice->subtotal)->toBe(200000)
        ->and($invoice->discount_amount)->toBe(0)
        ->and($invoice->total)->toBe(200000)
        ->and($invoice->issued_by)->toBe($this->secretaria->id)
        ->and($invoice->lines)->toHaveCount(2)
        ->and($invoice->lines->firstWhere('type', 'consulta')->doctor_fee)->toBe(100000)
        ->and($account->fresh()->status)->toBe('facturada');
});

test('a percentage discount lowers the total and the doctor fee in proportion', function () {
    $account = billableAccount($this->patient, $this->doctor, $this->admin);

    $invoice = invoiceAccount($this->secretaria, $account, [
        'discount_type' => 'porcentaje',
        'discount_value' => 10,
        'discount_reason' => 'Paciente referido por el Dr. Rodríguez',
    ]);

    expect($invoice->discount_amount)->toBe(20000)
        ->and($invoice->total)->toBe(180000)
        ->and($invoice->discount_reason)->toBe('Paciente referido por el Dr. Rodríguez')
        // RD$1,000 fee × 90%
        ->and($invoice->lines->firstWhere('type', 'consulta')->doctor_fee)->toBe(90000);
});

test('a fixed-amount discount is applied and cannot exceed the total', function () {
    $account = billableAccount($this->patient, $this->doctor, $this->admin);

    $this->actingAs($this->secretaria)
        ->post("/facturacion/cuentas/{$account->id}/facturar", [
            'discount_type' => 'monto', 'discount_value' => 250000, 'discount_reason' => 'Error',
        ])
        ->assertSessionHasErrors(['discount_value']);

    $invoice = invoiceAccount($this->secretaria, $account, [
        'discount_type' => 'monto', 'discount_value' => 50000, 'discount_reason' => 'Cortesía',
    ]);
    expect($invoice->total)->toBe(150000);
});

test('a 100% discount leaves nothing to collect and the doctor fee at zero', function () {
    $account = billableAccount($this->patient, $this->doctor, $this->admin);

    $invoice = invoiceAccount($this->secretaria, $account, [
        'discount_type' => 'porcentaje', 'discount_value' => 100, 'discount_reason' => 'Familiar del médico',
    ]);

    expect($invoice->total)->toBe(0)
        ->and($invoice->status)->toBe('pagada')
        ->and($invoice->lines->firstWhere('type', 'consulta')->doctor_fee)->toBe(0);
});

test('a discount over 100% or without a reason is rejected', function () {
    $account = billableAccount($this->patient, $this->doctor, $this->admin);

    $this->actingAs($this->secretaria)
        ->post("/facturacion/cuentas/{$account->id}/facturar", [
            'discount_type' => 'porcentaje', 'discount_value' => 120, 'discount_reason' => 'x',
        ])
        ->assertSessionHasErrors(['discount_value']);

    $this->actingAs($this->secretaria)
        ->post("/facturacion/cuentas/{$account->id}/facturar", [
            'discount_type' => 'porcentaje', 'discount_value' => 10,
        ])
        ->assertSessionHasErrors(['discount_reason']);

    expect(Invoice::count())->toBe(0);
});

test('an account still in care or already invoiced cannot be invoiced', function () {
    $inCare = billableAccount($this->patient, $this->doctor, $this->admin, 'abierta');
    $this->actingAs($this->secretaria)
        ->post("/facturacion/cuentas/{$inCare->id}/facturar")
        ->assertSessionHasErrors(['account']);

    $account = billableAccount(Patient::factory()->create(), $this->doctor, $this->admin);
    invoiceAccount($this->secretaria, $account);
    $this->actingAs($this->secretaria)
        ->post("/facturacion/cuentas/{$account->id}/facturar")
        ->assertSessionHasErrors(['account' => 'Esta cuenta ya fue facturada.']);

    expect(Invoice::count())->toBe(1);
});

test('doctors cannot bill', function () {
    $account = billableAccount($this->patient, $this->doctor, $this->admin);

    $this->actingAs($this->medico)->get('/facturacion')->assertForbidden();
    $this->actingAs($this->medico)
        ->post("/facturacion/cuentas/{$account->id}/facturar")
        ->assertForbidden();
});

// ─── Voiding ──────────────────────────────────────────────────────────────────

test('only an administrator voids an invoice, with a reason, and the account can be invoiced again', function () {
    $account = billableAccount($this->patient, $this->doctor, $this->admin);
    $invoice = invoiceAccount($this->secretaria, $account);

    $this->actingAs($this->secretaria)
        ->post("/facturacion/facturas/{$invoice->id}/anular", ['void_reason' => 'Error'])
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->post("/facturacion/facturas/{$invoice->id}/anular", [])
        ->assertSessionHasErrors(['void_reason']);

    $this->actingAs($this->admin)
        ->post("/facturacion/facturas/{$invoice->id}/anular", ['void_reason' => 'Se facturó con el descuento equivocado'])
        ->assertSessionHasNoErrors();

    $invoice->refresh();
    expect($invoice->status)->toBe('anulada')
        ->and($invoice->voided_by)->toBe($this->admin->id)
        ->and($invoice->balance())->toBe(0)
        ->and($account->fresh()->status)->toBe('pendiente_facturar');

    $again = invoiceAccount($this->secretaria, $account);
    expect($again->number)->toBe('F-0000002');
});

test('an invoice with payments cannot be voided', function () {
    $invoice = invoiceAccount($this->secretaria, billableAccount($this->patient, $this->doctor, $this->admin));
    $invoice->update(['paid_amount' => 50000]);

    $this->actingAs($this->admin)
        ->post("/facturacion/facturas/{$invoice->id}/anular", ['void_reason' => 'Error'])
        ->assertSessionHasErrors(['invoice']);

    expect($invoice->fresh()->status)->toBe('pendiente');
});

// ─── Pages ────────────────────────────────────────────────────────────────────

test('Facturación lists accounts to invoice, accounts in care and invoices', function () {
    billableAccount($this->patient, $this->doctor, $this->admin);
    billableAccount(Patient::factory()->create(), $this->doctor, $this->admin, 'abierta');
    $invoice = invoiceAccount($this->secretaria, billableAccount(Patient::factory()->create(), $this->doctor, $this->admin));

    $this->actingAs($this->secretaria)
        ->get("/facturacion?factura={$invoice->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('caja/index')
            ->has('pending_accounts', 1)
            ->where('pending_accounts.0.total', 200000)
            ->has('pending_accounts.0.charges', 2)
            ->has('accounts_in_care', 1)
            ->has('invoices', 1)
            ->where('selected_invoice.number', 'F-0000001')
            ->has('selected_invoice.lines', 2)
            ->where('can_void', false)
        );
});

test('the invoice print page renders', function () {
    $invoice = invoiceAccount($this->secretaria, billableAccount($this->patient, $this->doctor, $this->admin));

    $this->actingAs($this->secretaria)
        ->get("/facturacion/facturas/{$invoice->id}/imprimir")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('caja/factura-imprimir')
            ->where('invoice.number', 'F-0000001')
            ->where('invoice.total', 200000)
        );
});

test('the invoices migration can be rolled back', function () {
    $migration = '2026_11_01_200000_create_invoices_table';

    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('invoices'))->toBeFalse()
        ->and(Schema::hasTable('invoice_lines'))->toBeFalse();

    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('invoices'))->toBeTrue();
});
