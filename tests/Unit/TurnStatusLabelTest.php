<?php

use App\Models\Turn;

// ─── Turn::statusLabel() ─────────────────────────────────────────────────────

test('statusLabel returns "En espera" for espera', function () {
    expect(Turn::statusLabel('espera'))->toBe('En espera');
});

test('statusLabel returns "En consulta" for en_consulta', function () {
    expect(Turn::statusLabel('en_consulta'))->toBe('En consulta');
});

test('statusLabel returns "Atendido" for atendido', function () {
    expect(Turn::statusLabel('atendido'))->toBe('Atendido');
});

test('statusLabel returns "No asistió" for no_asistio', function () {
    expect(Turn::statusLabel('no_asistio'))->toBe('No asistió');
});

test('statusLabel returns the raw value for unknown states', function () {
    expect(Turn::statusLabel('unknown_state'))->toBe('unknown_state');
});
