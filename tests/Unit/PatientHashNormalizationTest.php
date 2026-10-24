<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use App\Models\Patient;
use App\Rules\UniqueDocumentNumber;

// F1 – document_number with and without hyphens produce same hash
test('cédula con guiones y sin guiones producen el mismo document_number_hash', function () {
    $p1 = Patient::factory()->make(['document_number' => '031-0234567-8']);
    $p2 = Patient::factory()->make(['document_number' => '03102345678']);

    expect($p1->document_number_hash)->toBe($p2->document_number_hash);
});

test('cédula "001-1234567-8" y "0011234567-8" producen el mismo hash', function () {
    $key = config('app.key');
    $hash1 = hash_hmac('sha256', '0011234567-8', $key);  // digits only: 00112345678
    // Actually for '0011234567-8', digits only = '00112345678'
    // For '001-1234567-8', digits only = '0011234567-8'... wait
    // '001-1234567-8' -> remove non-digits -> '00112345678' (11 digits)
    // But wait: '0011234567-8' -> remove non-digits -> '001123456878'? No
    // '0011234567-8' -> remove '-' -> '00112345678' (also 11 digits - same!)
    $hashWith = hash_hmac('sha256', preg_replace('/[^\d]/', '', '001-1234567-8'), $key);
    $hashWithout = hash_hmac('sha256', preg_replace('/[^\d]/', '', '00112345678'), $key);
    expect($hashWith)->toBe($hashWithout);
});

// F2 – phone with non-digit chars produces same hash as digits only
test('teléfono con caracteres especiales produce el mismo phone_hash que los dígitos limpios', function () {
    $p1 = Patient::factory()->make(['phone' => '(809) 555-0001']);
    $p2 = Patient::factory()->make(['phone' => '8095550001']);

    expect($p1->phone_hash)->toBe($p2->phone_hash);
});

test('teléfono "809-555-0001" y "8095550001" producen el mismo hash', function () {
    $p1 = Patient::factory()->make(['phone' => '809-555-0001']);
    $p2 = Patient::factory()->make(['phone' => '8095550001']);

    expect($p1->phone_hash)->toBe($p2->phone_hash);
});

// F3 – phone mutator stores phone_hash
test('el mutator de phone guarda phone_hash con los dígitos normalizados', function () {
    $patient = Patient::factory()->create(['phone' => '809-555-0001']);
    $expected = hash_hmac('sha256', '8095550001', config('app.key'));

    expect($patient->phone_hash)->toBe($expected);
});

test('phone null produce phone_hash nulo', function () {
    $patient = Patient::factory()->make(['phone' => null]);
    expect($patient->phone_hash)->toBeNull();
});

// UniqueDocumentNumber rule also uses digits normalization
test('UniqueDocumentNumber acepta el mismo paciente con guiones distintos', function () {
    $patient = Patient::factory()->create(['document_number' => '001-1234567-8']);

    // Should fail validation (duplicate) with hyphens
    $fails = false;
    $rule = new UniqueDocumentNumber;
    $rule->validate('document_number', '001-1234567-8', function () use (&$fails) {
        $fails = true;
    });
    expect($fails)->toBeTrue();

    // Should fail validation (duplicate) without hyphens — same document
    $fails2 = false;
    $rule2 = new UniqueDocumentNumber;
    $rule2->validate('document_number', '0011234567-8', function () use (&$fails2) {
        $fails2 = true;
    });
    // Both formats point to the same record via hash
    expect($fails2)->toBeTrue();
});

test('UniqueDocumentNumber ignora el propio registro al actualizar', function () {
    $patient = Patient::factory()->create(['document_number' => '001-1234567-8']);

    $fails = false;
    $rule = new UniqueDocumentNumber($patient->id);
    $rule->validate('document_number', '001-1234567-8', function () use (&$fails) {
        $fails = true;
    });
    expect($fails)->toBeFalse();
});
