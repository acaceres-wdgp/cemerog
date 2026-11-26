<?php

use App\Models\Invoice;
use App\Models\ResultAccessCode;

require_once __DIR__.'/helpers.php';

beforeEach(function () {
    $this->caja = portalStaff('caja');
    $this->patient = portalPatient();
});

function billedPortalInvoice(array $types, $by): Invoice
{
    $account = portalAccount(test()->patient, $by, $types);
    test()->actingAs($by)->post("/facturacion/cuentas/{$account->id}/facturar")->assertSessionHasNoErrors();

    return Invoice::latest('id')->first();
}

test('the printed invoice and receipt bring the QR, the portal link and the code', function () {
    $invoice = billedPortalInvoice(['consulta', 'laboratorio', 'imagen'], $this->caja);
    $code = 'CMG-'.substr(ResultAccessCode::sole()->code_encrypted, 0, 4).'-'.substr(ResultAccessCode::sole()->code_encrypted, 4);

    $this->actingAs($this->caja)
        ->get("/facturacion/facturas/{$invoice->id}/imprimir")
        ->assertInertia(fn ($page) => $page
            ->where('results_access.code', $code)
            ->where('results_access.url', route('portal', ['c' => $code]))
            ->where('results_access.display_url', preg_replace('#^https?://#', '', route('portal')))
            ->where('results_access.expires_on', now()->addDays(90)->format('d/m/Y'))
            ->where('results_access.qr', fn (string $qr) => str_starts_with($qr, 'data:image/svg+xml;base64,')
                && str_contains(base64_decode(substr($qr, 26)), '<svg'))
        );

    $this->actingAs($this->caja)->post('/caja/turno', ['opening_amount' => 100000]);
    $this->actingAs($this->caja)->post("/facturacion/facturas/{$invoice->id}/pagos", [
        'payments' => [['method' => 'efectivo', 'amount' => $invoice->total]],
    ]);
    $receipt = $invoice->receipts()->first();
    $this->actingAs($this->caja)
        ->get("/facturacion/recibos/{$receipt->id}/imprimir")
        ->assertInertia(fn ($page) => $page->where('results_access.code', $code));
});

test('an invoice without lab or imaging prints no code', function () {
    $invoice = billedPortalInvoice(['consulta'], $this->caja);

    $this->actingAs($this->caja)
        ->get("/facturacion/facturas/{$invoice->id}/imprimir")
        ->assertInertia(fn ($page) => $page->where('results_access', null));
    $this->actingAs($this->caja)
        ->get("/facturacion?factura={$invoice->id}")
        ->assertInertia(fn ($page) => $page->where('selected_invoice.results', null));
});

test('facturación shows the current code of the invoice', function () {
    $invoice = billedPortalInvoice(['laboratorio'], $this->caja);

    $this->actingAs($this->caja)
        ->get("/facturacion?factura={$invoice->id}")
        ->assertInertia(fn ($page) => $page
            ->where('selected_invoice.results.code.code', fn ($c) => str_starts_with($c, 'CMG-'))
            ->where('selected_invoice.results.code.expires_on', now()->addDays(90)->format('d/m/Y'))
        );
});

test('a new code from caja or recepción makes the previous one stop working', function () {
    $invoice = billedPortalInvoice(['laboratorio'], $this->caja);
    $old = ResultAccessCode::sole();
    $oldPlain = 'CMG-'.$old->code_encrypted;

    $this->actingAs($this->caja)
        ->post("/facturacion/facturas/{$invoice->id}/codigo-resultados")
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast.type', 'success');

    expect($old->fresh()->revoked_at)->not->toBeNull()
        ->and(ResultAccessCode::whereNull('revoked_at')->count())->toBe(1);

    auth()->logout();
    portalLogin($oldPlain)->assertSessionHas('inertia.flash_data.access_error.type', 'vencido');
    $new = ResultAccessCode::whereNull('revoked_at')->sole();
    portalLogin('CMG-'.$new->code_encrypted)->assertRedirect('/resultados/mis-resultados');

    $secretaria = portalStaff('secretaria');
    $this->actingAs($secretaria)->post("/facturacion/facturas/{$invoice->id}/codigo-resultados")->assertRedirect();
    $enfermera = portalStaff('enfermeria');
    $this->actingAs($enfermera)->post("/facturacion/facturas/{$invoice->id}/codigo-resultados")->assertForbidden();
});

test('no code is made for an invoice without lab or imaging', function () {
    $invoice = billedPortalInvoice(['consulta'], $this->caja);

    $this->actingAs($this->caja)->post("/facturacion/facturas/{$invoice->id}/codigo-resultados")->assertNotFound();
    expect(ResultAccessCode::count())->toBe(0);
});
