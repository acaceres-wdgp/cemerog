<?php

use App\Models\Patient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

// ── phone ────────────────────────────────────────────────────────────────────

test('phone Attribute stores a single encryptString payload (no double-encryption)', function () {
    $patient = Patient::factory()->create(['phone' => '(809) 555-1234']);

    $raw = DB::table('patients')->where('id', $patient->id)->value('phone');

    // Must decrypt with decryptString (no serialization)
    expect(Crypt::decryptString($raw))->toBe('(809) 555-1234');

    // And reading back through the model gives plain text
    expect($patient->fresh()->phone)->toBe('(809) 555-1234');
});

test('phone Attribute stores the digits-only hash', function () {
    $patient = Patient::factory()->create(['phone' => '(809) 555-0001']);

    $expected = hash_hmac('sha256', '8095550001', config('app.key'));
    $stored = DB::table('patients')->where('id', $patient->id)->value('phone_hash');

    expect($stored)->toBe($expected);
});

test('phone null stores null phone_hash', function () {
    $patient = Patient::factory()->create(['phone' => null]);

    expect(DB::table('patients')->where('id', $patient->id)->value('phone_hash'))->toBeNull();
});

// ── document_number ──────────────────────────────────────────────────────────

test('document_number Attribute stores a single encryptString payload', function () {
    $patient = Patient::factory()->create(['document_number' => '001-1234567-8']);

    $raw = DB::table('patients')->where('id', $patient->id)->value('document_number');

    expect(Crypt::decryptString($raw))->toBe('001-1234567-8');
    expect($patient->fresh()->document_number)->toBe('001-1234567-8');
});

test('document_number Attribute stores the digits-only hash', function () {
    $patient = Patient::factory()->create(['document_number' => '001-1234567-8']);

    $expected = hash_hmac('sha256', '00112345678', config('app.key'));
    $stored = DB::table('patients')->where('id', $patient->id)->value('document_number_hash');

    expect($stored)->toBe($expected);
});
