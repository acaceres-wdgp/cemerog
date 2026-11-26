<?php

use App\Models\ResultAccessCode;
use App\Models\ResultAccessLog;

require_once __DIR__.'/helpers.php';

beforeEach(function () {
    $this->caja = portalStaff('caja');
    $this->patient = portalPatient();
    $this->account = portalAccount($this->patient, $this->caja, ['laboratorio', 'imagen']);
    $this->code = portalCode($this->account, $this->caja);
});

test('the access page is public and ?c= only fills in the code', function () {
    $this->get('/resultados?c=CMG-ABCD-2345')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('portal/acceso')
            ->where('prefill', 'CMG-ABCD-2345')
            ->where('locked', false)
        );

    $this->get('/resultados/mis-resultados')->assertRedirect('/resultados');
});

test('the code and the birth date open the results', function () {
    portalLogin('cmg abcd 2345', '21/05/1992')->assertRedirect('/resultados/mis-resultados');

    expect(session('portal.code_id'))->toBe(ResultAccessCode::first()->id)
        ->and(ResultAccessCode::first()->last_used_at)->not->toBeNull()
        ->and(ResultAccessLog::where('event', 'login_ok')->count())->toBe(1);
    $this->get('/resultados/mis-resultados')->assertOk();
});

test('the session id is regenerated on entering', function () {
    $this->get('/resultados');
    $before = session()->getId();

    portalLogin($this->code);

    expect(session()->getId())->not->toBe($before);
});

test('a wrong birth date gives the same generic error and counts the attempt', function () {
    portalLogin($this->code, '12/05/1992')
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.access_error', ['type' => 'datos', 'remaining' => 4]);

    // A code that does not exist gives exactly the same answer
    portalLogin('CMG-ZZZZ-ZZZZ')
        ->assertSessionHas('inertia.flash_data.access_error', ['type' => 'datos', 'remaining' => 3]);

    expect(session('portal.code_id'))->toBeNull()
        ->and(ResultAccessLog::where('event', 'login_fail')->count())->toBe(2);
});

test('five failures lock the access for 15 minutes, by IP and by code', function () {
    foreach (range(1, 4) as $_) {
        portalLogin($this->code, '01/01/2000');
    }
    portalLogin($this->code, '01/01/2000')
        ->assertSessionHas('inertia.flash_data.access_error.type', 'bloqueado');

    // Even with the right date
    portalLogin($this->code)->assertSessionHas('inertia.flash_data.access_error.type', 'bloqueado');
    expect(session('portal.code_id'))->toBeNull()
        ->and(ResultAccessLog::where('event', 'locked')->count())->toBeGreaterThan(0);
    $this->get('/resultados')->assertInertia(fn ($page) => $page->where('locked', true));

    // The same code from another IP is locked too
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.9']);
    portalLogin($this->code)->assertSessionHas('inertia.flash_data.access_error.type', 'bloqueado');

    $this->travel(16)->minutes();
    portalLogin($this->code)->assertRedirect('/resultados/mis-resultados');
});

test('an expired or revoked code does not enter; with the right date it says so', function () {
    ResultAccessCode::first()->update(['expires_at' => now()->subDay()]);

    portalLogin($this->code)
        ->assertSessionHas('inertia.flash_data.access_error', [
            'type' => 'vencido',
            'date' => now()->subDay()->format('d/m/Y'),
        ]);
    // With a wrong date it is the generic error
    portalLogin($this->code, '01/01/2000')
        ->assertSessionHas('inertia.flash_data.access_error.type', 'datos');

    ResultAccessCode::first()->update(['expires_at' => now()->addDays(10), 'revoked_at' => now()]);
    portalLogin($this->code)->assertSessionHas('inertia.flash_data.access_error.type', 'vencido');
    expect(session('portal.code_id'))->toBeNull();
});

test('incomplete data is not an attempt', function () {
    portalLogin('CMG-ABCD', '21/05')
        ->assertSessionHas('inertia.flash_data.access_error', ['type' => 'incompleto']);

    portalLogin($this->code, '01/01/2000')
        ->assertSessionHas('inertia.flash_data.access_error.remaining', 4);
});

test('the session ends after 15 minutes without use', function () {
    portalLogin($this->code);

    $this->travel(14)->minutes();
    $this->get('/resultados/mis-resultados')->assertOk();
    $this->travel(14)->minutes();
    $this->get('/resultados/mis-resultados')->assertOk();

    $this->travel(16)->minutes();
    $this->get('/resultados/mis-resultados')->assertRedirect('/resultados');
    expect(session('portal.code_id'))->toBeNull();
});

test('a code revoked while in session closes it', function () {
    portalLogin($this->code);
    ResultAccessCode::first()->update(['revoked_at' => now()]);

    $this->get('/resultados/mis-resultados')->assertRedirect('/resultados');
});

test('salir ends the portal session', function () {
    portalLogin($this->code);

    $this->post('/resultados/salir')->assertRedirect('/resultados');
    $this->get('/resultados/mis-resultados')->assertRedirect('/resultados');
});

test('the portal is not cached nor indexed, and robots.txt keeps crawlers out', function () {
    $response = $this->get('/resultados');
    expect($response->headers->get('Cache-Control'))->toContain('no-store')
        ->and($response->headers->get('X-Robots-Tag'))->toBe('noindex, nofollow');

    portalLogin($this->code);
    expect($this->get('/resultados/mis-resultados')->headers->get('Cache-Control'))->toContain('no-store');

    expect(file_get_contents(public_path('robots.txt')))->toContain('Disallow: /resultados');
});

test('a logged-in staff member does not enter the portal without the code', function () {
    $this->actingAs($this->caja)->get('/resultados/mis-resultados')->assertRedirect('/resultados');
});
