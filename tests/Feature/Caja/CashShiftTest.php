<?php

use App\Actions\Caja\CashShiftSummary;
use App\Models\CashShift;
use App\Models\User;

beforeEach(function () {
    $this->cajero = User::factory()->create(['name' => 'Kenia Marte']);
    $this->cajero->assignRole('caja');

    $this->secretaria = User::factory()->create(['name' => 'Rosa Castillo']);
    $this->secretaria->assignRole('secretaria');

    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');

    $this->medico = User::factory()->create();
    $this->medico->assignRole('medico');
});

function openShift(User $user, int $amount = 500000): CashShift
{
    test()->actingAs($user)
        ->post('/caja/turno', ['opening_amount' => $amount])
        ->assertSessionHasNoErrors();

    return CashShift::current();
}

// ─── Opening ──────────────────────────────────────────────────────────────────

test('a cashier opens the register with an opening float', function () {
    $shift = openShift($this->cajero, 500000);

    expect($shift->opened_by)->toBe($this->cajero->id)
        ->and($shift->opening_amount)->toBe(500000)
        ->and($shift->status)->toBe('abierto')
        ->and($shift->opening_denominations)->toBeNull();
});

test('the opening float can be counted by denomination', function () {
    $this->actingAs($this->secretaria)
        ->post('/caja/turno', ['denominations' => ['1000' => 3, '100' => 5, '25' => 4, '7' => 9]])
        ->assertSessionHasNoErrors();

    $shift = CashShift::current();
    // 3 × 1,000 + 5 × 100 + 4 × 25 = RD$3,600 (unknown face values are ignored)
    expect($shift->opening_amount)->toBe(360000)
        ->and($shift->opening_denominations)->toBe(['1000' => 3, '100' => 5, '25' => 4]);
});

test('there is a single register: a second shift cannot open while one is open', function () {
    openShift($this->cajero);

    $this->actingAs($this->secretaria)
        ->post('/caja/turno', ['opening_amount' => 100000])
        ->assertSessionHasErrors(['shift' => 'La caja ya está abierta por Kenia Marte. Debe cerrarse antes de abrir otro turno.']);

    expect(CashShift::count())->toBe(1);
});

test('a doctor cannot open the register', function () {
    $this->actingAs($this->medico)
        ->post('/caja/turno', ['opening_amount' => 100000])
        ->assertForbidden();
});

test('the opening float is required', function () {
    $this->actingAs($this->cajero)
        ->post('/caja/turno', [])
        ->assertSessionHasErrors(['opening_amount']);
});

// ─── Withdrawals ──────────────────────────────────────────────────────────────

test('the cashier withdraws cash with a reason and it lowers the expected cash', function () {
    $shift = openShift($this->cajero, 500000);

    $this->actingAs($this->cajero)
        ->post('/caja/turno/retiros', ['amount' => 200000, 'reason' => 'Depósito al banco'])
        ->assertSessionHasNoErrors();

    $summary = app(CashShiftSummary::class)->handle($shift);
    expect($summary['withdrawals'])->toBe(200000)
        ->and($summary['expected_cash'])->toBe(300000);
});

test('a withdrawal cannot exceed the cash in the drawer', function () {
    openShift($this->cajero, 100000);

    $this->actingAs($this->cajero)
        ->post('/caja/turno/retiros', ['amount' => 150000, 'reason' => 'Gasto'])
        ->assertSessionHasErrors(['amount']);
});

test('a withdrawal needs a reason', function () {
    openShift($this->cajero);

    $this->actingAs($this->cajero)
        ->post('/caja/turno/retiros', ['amount' => 1000])
        ->assertSessionHasErrors(['reason']);
});

test('another cashier cannot withdraw from a shift they did not open', function () {
    openShift($this->cajero);

    $this->actingAs($this->secretaria)
        ->post('/caja/turno/retiros', ['amount' => 1000, 'reason' => 'Gasto'])
        ->assertForbidden();
});

test('withdrawing without an open shift is an error', function () {
    $this->actingAs($this->cajero)
        ->post('/caja/turno/retiros', ['amount' => 1000, 'reason' => 'Gasto'])
        ->assertSessionHasErrors(['shift']);
});

// ─── Closing ──────────────────────────────────────────────────────────────────

test('closing with the exact expected cash records no difference and frees the register', function () {
    $shift = openShift($this->cajero, 500000);

    $this->actingAs($this->cajero)
        ->post('/cuadre-de-caja/cerrar', ['counted_cash' => 500000, 'confirmed' => true])
        ->assertRedirect(route('cuadre'))
        ->assertSessionHasNoErrors();

    $shift->refresh();
    expect($shift->status)->toBe('cerrado')
        ->and($shift->open_lock)->toBeNull()
        ->and($shift->expected_cash)->toBe(500000)
        ->and($shift->counted_cash)->toBe(500000)
        ->and($shift->difference)->toBe(0)
        ->and($shift->closed_by)->toBe($this->cajero->id)
        ->and(CashShift::current())->toBeNull();

    // Another cashier can now open the next shift
    openShift($this->secretaria, 100000);
    expect(CashShift::count())->toBe(2);
});

test('a difference needs a note and is recorded as shortage', function () {
    openShift($this->cajero, 500000);

    $this->actingAs($this->cajero)
        ->post('/cuadre-de-caja/cerrar', ['counted_cash' => 480000, 'confirmed' => true])
        ->assertSessionHasErrors(['close_note']);

    $this->actingAs($this->cajero)
        ->post('/cuadre-de-caja/cerrar', [
            'counted_cash' => 480000,
            'confirmed' => true,
            'close_note' => 'Faltan 200 pesos, se revisará mañana',
        ])
        ->assertSessionHasNoErrors();

    $shift = CashShift::latest('id')->first();
    expect($shift->difference)->toBe(-20000)
        ->and($shift->close_note)->toBe('Faltan 200 pesos, se revisará mañana');
});

test('the count can be given by denomination when closing', function () {
    openShift($this->cajero, 360000);

    $this->actingAs($this->cajero)
        ->post('/cuadre-de-caja/cerrar', [
            'denominations' => ['1000' => 3, '500' => 1, '100' => 1],
            'confirmed' => true,
        ])
        ->assertSessionHasNoErrors();

    $shift = CashShift::latest('id')->first();
    expect($shift->counted_cash)->toBe(360000)
        ->and($shift->difference)->toBe(0)
        ->and($shift->counted_denominations)->toBe(['1000' => 3, '500' => 1, '100' => 1]);
});

test('closing requires marking the register as balanced', function () {
    openShift($this->cajero, 500000);

    $this->actingAs($this->cajero)
        ->post('/cuadre-de-caja/cerrar', ['counted_cash' => 500000])
        ->assertSessionHasErrors(['confirmed']);

    expect(CashShift::current())->not->toBeNull();
});

test('only the cashier who opened it or an administrator closes the shift', function () {
    openShift($this->cajero, 500000);

    $this->actingAs($this->secretaria)
        ->post('/cuadre-de-caja/cerrar', ['counted_cash' => 500000, 'confirmed' => true])
        ->assertForbidden();

    $this->actingAs($this->admin)
        ->post('/cuadre-de-caja/cerrar', ['counted_cash' => 500000, 'confirmed' => true])
        ->assertSessionHasNoErrors();

    expect(CashShift::current())->toBeNull();
});

// ─── Shared prop and Cuadre page ─────────────────────────────────────────────

test('cashiers see the open shift in the shared props; doctors do not', function () {
    openShift($this->cajero, 500000);

    $this->actingAs($this->secretaria)
        ->get('/cuadre-de-caja')
        ->assertInertia(fn ($page) => $page
            ->where('cash_shift.opened_by', 'Kenia Marte')
            ->where('cash_shift.mine', false)
            ->where('cash_shift.can_operate', false)
            ->where('cash_shift.pending_close', false)
        );

    $this->actingAs($this->medico)
        ->get('/inicio')
        ->assertInertia(fn ($page) => $page->where('cash_shift', null));
});

test('a shift opened on a previous day shows as pending close', function () {
    $shift = openShift($this->cajero, 500000);
    $shift->update(['opened_at' => now()->subDay()]);

    $this->actingAs($this->admin)
        ->get('/cuadre-de-caja')
        ->assertInertia(fn ($page) => $page
            ->where('cash_shift.pending_close', true)
            ->where('shift.pending_close', true)
            ->where('shift.can_operate', true)
        );
});

test('the Cuadre page shows the open shift summary and lists the closed shifts', function () {
    openShift($this->cajero, 500000);
    $this->actingAs($this->cajero)->post('/caja/turno/retiros', ['amount' => 100000, 'reason' => 'Depósito']);
    $this->actingAs($this->cajero)->post('/cuadre-de-caja/cerrar', [
        'counted_cash' => 400000,
        'confirmed' => true,
    ]);
    openShift($this->cajero, 200000);

    $this->actingAs($this->cajero)
        ->get('/cuadre-de-caja')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('cuadre/index')
            ->where('shift.summary.opening', 200000)
            ->where('shift.summary.expected_cash', 200000)
            ->where('shift.can_operate', true)
            ->has('shifts', 2)
            ->where('shifts.0.status', 'abierto')
            ->where('shifts.1.status', 'cerrado')
            ->has('denominations', 10)
        );
});

test('the cash shift migration can be rolled back', function () {
    $migration = '2026_11_01_100000_create_cash_shifts_table';

    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('cash_shifts'))->toBeFalse()
        ->and(Schema::hasTable('cash_withdrawals'))->toBeFalse();

    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasTable('cash_shifts'))->toBeTrue();
});
