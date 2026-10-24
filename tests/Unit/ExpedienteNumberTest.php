<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use App\Models\Patient;

// G1 – id=1 → P-00001
test('id 1 formatea como P-00001', function () {
    $patient = Patient::factory()->make(['id' => 1]);
    // Manually set id since factory uses make()
    $patient->id = 1;
    expect($patient->expediente_number)->toBe('P-00001');
});

// G2 – id=42 → P-00042
test('id 42 formatea como P-00042', function () {
    $patient = Patient::factory()->make();
    $patient->id = 42;
    expect($patient->expediente_number)->toBe('P-00042');
});

// G3 – id=100000 → P-100000 (no truncation)
test('id 100000 formatea como P-100000 sin truncar', function () {
    $patient = Patient::factory()->make();
    $patient->id = 100000;
    expect($patient->expediente_number)->toBe('P-100000');
});

test('id 99999 formatea como P-99999', function () {
    $patient = Patient::factory()->make();
    $patient->id = 99999;
    expect($patient->expediente_number)->toBe('P-99999');
});
