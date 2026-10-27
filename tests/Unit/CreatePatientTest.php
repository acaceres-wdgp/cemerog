<?php

use App\Actions\CreatePatient;
use App\Models\Patient;
use App\Support\Pii;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

// C1 – GEN- collision: retries until a unique code is found
test('CreatePatient retries GEN- code generation on hash collision', function () {
    // Control Str::random to return 'AAAAAAAA' first, then 'BBBBBBBB'.
    Str::createRandomStringsUsingSequence(['AAAAAAAA', 'BBBBBBBB']);

    // Pre-create a patient whose document_number_hash matches the first attempt.
    $firstCode = 'GEN-AAAAAAAA';
    $firstHash = Pii::documentHash('no_tiene', $firstCode);
    Patient::factory()->create([
        'document_type' => 'no_tiene',
        'document_number' => $firstCode,
        'document_number_hash' => $firstHash,
    ]);

    $action = new CreatePatient;
    $patient = $action->handle([
        'document_type' => 'no_tiene',
        'document_number' => '',
        'first_names' => 'Test',
        'last_names' => 'Collision',
        'birth_date' => '1990-01-01',
        'sex' => 'M',
        'emergency_contact_name' => 'X',
        'emergency_contact_phone' => '8090000000',
    ]);

    Str::createRandomStringsNormally();

    expect($patient)->not->toBeNull();
    expect($patient->document_number)->toBe('GEN-BBBBBBBB');
    expect(Patient::count())->toBe(2);
});
