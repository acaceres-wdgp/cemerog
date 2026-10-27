<?php

use App\Support\Pii;

// DH1 – Cédula: with and without hyphens produce the same hash
test('cédula con guiones y sin guiones producen el mismo documentHash', function () {
    $withHyphens = Pii::documentHash('cedula', '001-1234567-8');
    $withoutHyphens = Pii::documentHash('cedula', '00112345678');

    expect($withHyphens)->toBe($withoutHyphens);
});

// DH2 – Pasaporte: two different passports produce different hashes
test('dos pasaportes distintos producen hashes distintos', function () {
    $hash1 = Pii::documentHash('pasaporte', 'AB123456');
    $hash2 = Pii::documentHash('pasaporte', 'XY123456');

    expect($hash1)->not->toBe($hash2);
});

// DH3 – Pasaporte: lowercase = uppercase, hyphens ignored
test('pasaporte en minúsculas es igual al mismo en mayúsculas con guiones', function () {
    $lower = Pii::documentHash('pasaporte', 'ab123456');
    $upperHyphen = Pii::documentHash('pasaporte', 'AB-123456');

    expect($lower)->toBe($upperHyphen);
});

// DH4 – Type matters: cédula and passport with same digit sequence → different hashes
test('cédula y pasaporte con los mismos dígitos producen hashes distintos', function () {
    // cédula normalises to digits only: '00112345678'
    // pasaporte normalises to [A-Z0-9]: 'P00112345678'
    $cedula = Pii::documentHash('cedula', '001-1234567-8');
    $passport = Pii::documentHash('pasaporte', 'P001-1234567-8');

    expect($cedula)->not->toBe($passport);
});

// DH5 – no_tiene: two GEN- codes with same digits but different letters → different hashes
test('dos códigos GEN- con los mismos dígitos pero letras distintas producen hashes distintos', function () {
    $gen1 = Pii::documentHash('no_tiene', 'GEN-AB12CD34');
    $gen2 = Pii::documentHash('no_tiene', 'GEN-XY12ZW34');

    expect($gen1)->not->toBe($gen2);
});

// DH6 – cedula_extranjera shares normalisation with pasaporte
test('cedula_extranjera y pasaporte con el mismo valor producen el mismo hash', function () {
    $value = 'AB123456';
    $passport = Pii::documentHash('pasaporte', $value);
    $foreign = Pii::documentHash('cedula_extranjera', $value);

    expect($passport)->toBe($foreign);
});

// DH7 – no_tiene is case-insensitive (normalises uppercase)
test('no_tiene normaliza a mayúsculas: GEN-ab12cd34 = GEN-AB12CD34', function () {
    $lower = Pii::documentHash('no_tiene', 'GEN-ab12cd34');
    $upper = Pii::documentHash('no_tiene', 'GEN-AB12CD34');

    expect($lower)->toBe($upper);
});
