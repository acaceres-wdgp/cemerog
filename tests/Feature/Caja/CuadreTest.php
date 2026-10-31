<?php

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\CashShift;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->cajero = User::factory()->create(['name' => 'Kenia Marte']);
    $this->cajero->assignRole('caja');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
});

/** An issued invoice of the given total for a new patient */
function cuadreInvoice(User $by, int $total, string $patientName = 'Ana Torres'): Invoice
{
    [$first, $last] = explode(' ', $patientName);
    $account = Account::create([
        'patient_id' => Patient::factory()->create(['first_names' => $first, 'last_names' => $last])->id,
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
function cuadrePay(User $by, Invoice $invoice, array $payments): void
{
    test()->actingAs($by)
        ->post("/facturacion/facturas/{$invoice->id}/pagos", ['payments' => $payments])
        ->assertSessionHasNoErrors();
}

/** Open shift with RD$1,000, RD$2,000 cash and a mixed RD$1,500 (card 1,000 + transfer 500) */
function shiftWithMovements(User $cajero): CashShift
{
    test()->actingAs($cajero)->post('/caja/turno', ['opening_amount' => 100000]);
    cuadrePay($cajero, cuadreInvoice($cajero, 200000), [
        ['method' => 'efectivo', 'amount' => 200000, 'cash_received' => 200000],
    ]);
    cuadrePay($cajero, cuadreInvoice($cajero, 150000, 'Luis Gómez'), [
        ['method' => 'tarjeta', 'amount' => 100000],
        ['method' => 'transferencia', 'amount' => 50000, 'reference' => 'TRX-1'],
    ]);

    return CashShift::current();
}

test('the cuadre shows expected per method with its transactions and one movement per payment', function () {
    shiftWithMovements($this->cajero);

    $this->actingAs($this->cajero)
        ->get('/cuadre-de-caja')
        ->assertInertia(fn ($page) => $page
            ->component('cuadre/index')
            ->where('shift.status', 'abierto')
            ->where('shift.summary.expected_cash', 300000)
            ->where('shift.summary.transactions', ['efectivo' => 1, 'tarjeta' => 1, 'transferencia' => 1])
            ->where('shift.summary.income', ['efectivo' => 200000, 'tarjeta' => 100000, 'transferencia' => 50000])
            ->has('shift.movements', 3)
            ->where('shift.movements.0.receipt', 'R-0001')
            ->where('shift.movements.0.patient', 'Ana Torres')
            ->where('shift.movements.0.concept', 'Pago de F-0000001')
            ->where('shift.movements.0.method', 'efectivo')
            ->where('shift.movements.0.amount', 200000)
            ->where('shift.movements.2.method', 'transferencia')
            ->where('shift.counted', null)
            ->has('shifts', 1)
            ->where('shifts.0.status', 'abierto')
        );
});

test('closing records the counted card and transfer; any difference needs a note', function () {
    shiftWithMovements($this->cajero);

    $this->actingAs($this->cajero)
        ->post('/cuadre-de-caja/cerrar', [
            'counted_cash' => 300000, 'counted_card' => 90000, 'counted_transfer' => 50000, 'confirmed' => true,
        ])
        ->assertSessionHasErrors(['close_note']);

    $this->actingAs($this->cajero)
        ->post('/cuadre-de-caja/cerrar', [
            'counted_cash' => 300000, 'counted_card' => 100000, 'counted_transfer' => 50000, 'confirmed' => true,
        ])
        ->assertSessionHasNoErrors();

    $shift = CashShift::latest('id')->first();
    expect($shift->status)->toBe('cerrado')
        ->and($shift->counted_card)->toBe(100000)
        ->and($shift->counted_transfer)->toBe(50000)
        ->and($shift->difference)->toBe(0);
});

test('a closed shift can be picked and shows what was counted', function () {
    $shift = shiftWithMovements($this->cajero);
    $this->actingAs($this->cajero)->post('/cuadre-de-caja/cerrar', [
        'denominations' => ['2000' => 1, '1000' => 1],
        'counted_card' => 100000,
        'counted_transfer' => 50000,
        'confirmed' => true,
    ])->assertSessionHasNoErrors();

    $this->actingAs($this->cajero)
        ->get('/cuadre-de-caja')
        ->assertInertia(fn ($page) => $page
            ->where('shift', null)
            ->has('shifts', 1)
            ->where('shifts.0.id', $shift->id)
            ->where('shifts.0.status', 'cerrado')
        );

    $this->actingAs($this->cajero)
        ->get("/cuadre-de-caja?turno={$shift->id}")
        ->assertInertia(fn ($page) => $page
            ->where('shift.id', $shift->id)
            ->where('shift.status', 'cerrado')
            ->where('shift.can_operate', false)
            ->where('shift.counted.cash', 300000)
            ->where('shift.counted.card', 100000)
            ->where('shift.counted.transfer', 50000)
            ->where('shift.counted.denominations', ['2000' => 1, '1000' => 1])
            ->has('shift.movements', 3)
        );
});

test('the counted card and transfer migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_02_100000_add_counted_card_and_transfer_to_cash_shifts.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasColumn('cash_shifts', 'counted_card'))->toBeFalse()
        ->and(Schema::hasColumn('cash_shifts', 'counted_transfer'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasColumn('cash_shifts', 'counted_card'))->toBeTrue()
        ->and(Schema::hasColumn('cash_shifts', 'counted_transfer'))->toBeTrue();
});
