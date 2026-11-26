<?php

use App\Actions\Results\RegenerateResultAccessCode;
use App\Models\ResultAccessCode;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require_once __DIR__.'/helpers.php';

beforeEach(function () {
    $this->caja = portalStaff('caja');
    $this->patient = portalPatient();
});

function billPortalAccount($account, $user): void
{
    test()->actingAs($user)
        ->post("/facturacion/cuentas/{$account->id}/facturar")
        ->assertSessionHasNoErrors();
}

test('billing an account with lab or imaging studies creates its results code', function () {
    $account = portalAccount($this->patient, $this->caja, ['consulta', 'laboratorio']);

    billPortalAccount($account, $this->caja);

    $code = ResultAccessCode::sole();
    expect($code->account_id)->toBe($account->id)
        ->and($code->patient_id)->toBe($this->patient->id)
        ->and($code->invoice_id)->toBe($account->invoices()->value('id'))
        ->and($code->created_by)->toBe($this->caja->id)
        ->and($code->expires_at->toDateString())->toBe(now()->addDays(90)->toDateString())
        ->and($code->code_encrypted)->toMatch('/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/');
});

test('an account without lab or imaging gets no code', function () {
    $account = portalAccount($this->patient, $this->caja, ['consulta', 'medicamento']);

    billPortalAccount($account, $this->caja);

    expect(ResultAccessCode::count())->toBe(0);
});

test('billing the same account again (after voiding) keeps its code', function () {
    $admin = portalStaff('administrador');
    $account = portalAccount($this->patient, $this->caja, ['imagen']);
    billPortalAccount($account, $this->caja);
    $first = ResultAccessCode::sole();

    $this->actingAs($admin)
        ->post('/facturacion/facturas/'.$account->invoices()->value('id').'/anular', ['void_reason' => 'Error'])
        ->assertSessionHasNoErrors();
    billPortalAccount($account->fresh(), $this->caja);

    expect(ResultAccessCode::count())->toBe(1)
        ->and($first->fresh()->invoice_id)->toBe($account->invoices()->latest('id')->value('id'));
});

test('the code is never stored in plain text', function () {
    $account = portalAccount($this->patient, $this->caja, ['laboratorio']);
    billPortalAccount($account, $this->caja);
    $plain = ResultAccessCode::sole()->code_encrypted;

    $row = (array) DB::table('result_access_codes')->first();
    expect(json_encode($row))->not->toContain($plain)
        ->and($row['code_hash'])->toBe(hash('sha256', $plain.config('app.key')));
});

test('a new code revokes the previous one', function () {
    $account = portalAccount($this->patient, $this->caja, ['laboratorio']);
    billPortalAccount($account, $this->caja);
    $old = ResultAccessCode::sole();

    $new = app(RegenerateResultAccessCode::class)->handle($account, $this->caja);

    expect($old->fresh()->revoked_at)->not->toBeNull()
        ->and($new->id)->not->toBe($old->id)
        ->and($new->invoice_id)->toBe($old->invoice_id)
        ->and(portalCurrentCode($account)->id)->toBe($new->id);
});

test('the results access migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_26_100000_create_result_access_tables.php';

    Artisan::call('migrate:rollback', ['--path' => $path]);
    expect(Schema::hasTable('result_access_codes'))->toBeFalse()
        ->and(Schema::hasTable('result_access_logs'))->toBeFalse();

    Artisan::call('migrate', ['--path' => $path]);
    expect(Schema::hasTable('result_access_codes'))->toBeTrue();
});
