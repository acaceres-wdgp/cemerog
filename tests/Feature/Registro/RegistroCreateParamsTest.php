<?php

use App\Models\User;

beforeEach(function () {
    $this->secretaria = User::factory()->create();
    $this->secretaria->givePermissionTo('module.registro.access');
});

// P1 – ?documento passes sanitized value as prefillDocumentNumber prop
test('GET /registro?documento precarga el número de documento en la prop', function () {
    $response = $this->actingAs($this->secretaria)
        ->get('/registro?documento=001-1234567-8');

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('registro/index')
            ->where('prefillDocumentNumber', '001-1234567-8'),
    );
});

// P2 – ?nombre passes sanitized value as prefillFirstNames prop
test('GET /registro?nombre precarga el nombre en la prop', function () {
    $response = $this->actingAs($this->secretaria)
        ->get('/registro?'.http_build_query(['nombre' => 'María']));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('registro/index')
            ->where('prefillFirstNames', 'María'),
    );
});

// P3 – HTML tags are stripped from documento
test('GET /registro?documento sanitiza etiquetas HTML', function () {
    $response = $this->actingAs($this->secretaria)
        ->get('/registro?documento='.urlencode('<script>evil()</script>'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->where('prefillDocumentNumber', 'evil()'),
    );
});

// P4 – HTML tags are stripped from nombre
test('GET /registro?nombre sanitiza etiquetas HTML', function () {
    $response = $this->actingAs($this->secretaria)
        ->get('/registro?nombre='.urlencode('<b>Ana</b>'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->where('prefillFirstNames', 'Ana'),
    );
});

// P5 – documento is truncated at 30 chars
test('GET /registro?documento se trunca a 30 caracteres', function () {
    $long = str_repeat('A', 50);

    $response = $this->actingAs($this->secretaria)
        ->get('/registro?documento='.urlencode($long));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->where('prefillDocumentNumber', str_repeat('A', 30)),
    );
});

// P6 – nombre is truncated at 100 chars
test('GET /registro?nombre se trunca a 100 caracteres', function () {
    $long = str_repeat('B', 150);

    $response = $this->actingAs($this->secretaria)
        ->get('/registro?nombre='.urlencode($long));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->where('prefillFirstNames', str_repeat('B', 100)),
    );
});

// P7 – without params, both props are empty strings (not null)
test('GET /registro sin params las props prefill son cadenas vacías', function () {
    $response = $this->actingAs($this->secretaria)
        ->get('/registro');

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->where('prefillDocumentNumber', '')
            ->where('prefillFirstNames', ''),
    );
});
