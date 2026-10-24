<?php

use App\Support\Pii;
use Illuminate\Support\Facades\Crypt;

// ── Pii::encrypt / Pii::decrypt ───────────────────────────────────────────────

test('encrypt and decrypt round-trips the plain text', function () {
    $plain = '809-555-1234';
    expect(Pii::decrypt(Pii::encrypt($plain)))->toBe($plain);
});

test('encrypt stores with encryptString so decryptString works', function () {
    $encrypted = Pii::encrypt('809-555-1234');
    expect(Crypt::decryptString($encrypted))->toBe('809-555-1234');
});

test('decrypt handles encryptString format (current)', function () {
    $encrypted = Crypt::encryptString('809-555-1234');
    expect(Pii::decrypt($encrypted))->toBe('809-555-1234');
});

test('decrypt returns null for null', function () {
    expect(Pii::decrypt(null))->toBeNull();
});

test('decrypt returns null for empty string', function () {
    expect(Pii::decrypt(''))->toBeNull();
});

test('decrypt throws RuntimeException for corrupted value', function () {
    expect(fn () => Pii::decrypt('not-valid-ciphertext'))
        ->toThrow(RuntimeException::class);
});

test('encrypt returns null for null', function () {
    expect(Pii::encrypt(null))->toBeNull();
});

test('encrypt returns null for empty string', function () {
    expect(Pii::encrypt(''))->toBeNull();
});

// ── Pii::hash ─────────────────────────────────────────────────────────────────

test('hash computes HMAC-SHA256 over digits only', function () {
    $expected = hash_hmac('sha256', '8095551234', config('app.key'));
    expect(Pii::hash('(809) 555-1234'))->toBe($expected);
});

test('hash with fallbackToFull uses full value when no digits', function () {
    $expected = hash_hmac('sha256', 'ABC', config('app.key'));
    expect(Pii::hash('ABC', fallbackToFull: true))->toBe($expected);
});

test('hash returns null for null', function () {
    expect(Pii::hash(null))->toBeNull();
});

test('hash returns null for empty string', function () {
    expect(Pii::hash(''))->toBeNull();
});

test('hash returns null when value has no digits and fallbackToFull is false', function () {
    expect(Pii::hash('ABC'))->toBeNull();
});
