<?php

use App\Models\Patient;
use App\Support\Pii;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

const MIGRATION_PATH_HASHES = 'database/migrations/2026_10_25_233835_recalculate_document_number_hashes.php';

// ── MH1: up() recalculates hashes for all document types ─────────────────────

test('migration up() deja los hashes correctos para los tres tipos de documento', function () {
    $cedula = Patient::factory()->create([
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
    ]);
    $passport = Patient::factory()->create([
        'document_type' => 'pasaporte',
        'document_number' => 'AB123456',
    ]);
    $noTiene = Patient::factory()->create([
        'document_type' => 'no_tiene',
        'document_number' => 'GEN-AB12CD34',
    ]);

    // Simulate old-style hashes (digits-only) that a prior system left in the DB
    DB::table('patients')->where('id', $passport->id)->update([
        'document_number_hash' => hash_hmac('sha256', '123456', config('app.key')),
    ]);
    DB::table('patients')->where('id', $noTiene->id)->update([
        'document_number_hash' => hash_hmac('sha256', '1234', config('app.key')),
    ]);

    // Roll back and re-run so the migration actually executes (it already ran via RefreshDatabase)
    $this->artisan('migrate:rollback', ['--path' => MIGRATION_PATH_HASHES])->assertSuccessful();
    $this->artisan('migrate', ['--path' => MIGRATION_PATH_HASHES, '--force' => true])->assertSuccessful();

    expect(DB::table('patients')->where('id', $cedula->id)->value('document_number_hash'))
        ->toBe(Pii::documentHash('cedula', '001-1234567-8'));
    expect(DB::table('patients')->where('id', $passport->id)->value('document_number_hash'))
        ->toBe(Pii::documentHash('pasaporte', 'AB123456'));
    expect(DB::table('patients')->where('id', $noTiene->id)->value('document_number_hash'))
        ->toBe(Pii::documentHash('no_tiene', 'GEN-AB12CD34'));
});

// ── MH2: down() restores the old algorithm for a single cedula ───────────────
// (For passports, down() would collide when two passports share the same digits;
// that is the documented limitation of the old algorithm and is fixed by up().)

test('migration down() restaura el hash al algoritmo anterior (cédula)', function () {
    $cedula = Patient::factory()->create([
        'document_type' => 'cedula',
        'document_number' => '001-1234567-8',
    ]);

    $this->artisan('migrate:rollback', ['--path' => MIGRATION_PATH_HASHES])->assertSuccessful();

    $expectedOld = hash_hmac('sha256', '00112345678', config('app.key'));
    expect(DB::table('patients')->where('id', $cedula->id)->value('document_number_hash'))
        ->toBe($expectedOld);

    $this->artisan('migrate', ['--path' => MIGRATION_PATH_HASHES, '--force' => true])->assertSuccessful();
});

// ── MH3: two passports with same digits get different hashes ──────────────────

test('dos pasaportes con los mismos dígitos quedan con hashes distintos tras up()', function () {
    $p1 = Patient::factory()->create([
        'document_type' => 'pasaporte',
        'document_number' => 'AB123456',
    ]);
    $p2 = Patient::factory()->create([
        'document_type' => 'pasaporte',
        'document_number' => 'XY123456',
    ]);

    // Simulate old-style hashes. Both passports would produce hash('123456') under the
    // old algorithm — but we cannot store both in the DB due to the unique constraint.
    // Instead, set them to distinct placeholder values and call up() directly.
    DB::table('patients')->where('id', $p1->id)
        ->update(['document_number_hash' => hash_hmac('sha256', 'old_ab', config('app.key'))]);
    DB::table('patients')->where('id', $p2->id)
        ->update(['document_number_hash' => hash_hmac('sha256', 'old_xy', config('app.key'))]);

    // Call up() directly (bypasses the migrations table check)
    $migration = include database_path('migrations/2026_10_25_233835_recalculate_document_number_hashes.php');
    $migration->up();

    $hash1 = DB::table('patients')->where('id', $p1->id)->value('document_number_hash');
    $hash2 = DB::table('patients')->where('id', $p2->id)->value('document_number_hash');

    expect($hash1)->toBe(Pii::documentHash('pasaporte', 'AB123456'));
    expect($hash2)->toBe(Pii::documentHash('pasaporte', 'XY123456'));
    expect($hash1)->not->toBe($hash2);
});

// ── MH4: up() aborts when new hashes would collide ───────────────────────────

test('migration up() aborta si los hashes recalculados producirían duplicados', function () {
    // Temporarily drop unique constraint to insert conflicting rows
    Schema::table('patients', fn ($t) => $t->dropUnique(['document_number_hash']));

    // Two patients with the same plaintext document → same new hash
    DB::table('patients')->insert([
        [
            'document_type' => 'pasaporte',
            'document_number' => Pii::encrypt('AB123456'),
            'document_number_hash' => 'old_hash_1',
            'first_names' => 'Alice', 'last_names' => 'Smith',
            'birth_date' => '1990-01-01', 'sex' => 'F',
            'emergency_contact_name' => 'X', 'emergency_contact_phone' => '8095551111',
            'created_at' => now(), 'updated_at' => now(),
        ],
        [
            'document_type' => 'pasaporte',
            'document_number' => Pii::encrypt('AB123456'), // same → same new hash
            'document_number_hash' => 'old_hash_2',
            'first_names' => 'Bob', 'last_names' => 'Jones',
            'birth_date' => '1985-06-15', 'sex' => 'M',
            'emergency_contact_name' => 'Y', 'emergency_contact_phone' => '8095552222',
            'created_at' => now(), 'updated_at' => now(),
        ],
    ]);

    // Roll back so we can re-run up() and trigger the collision check
    $this->artisan('migrate:rollback', ['--path' => MIGRATION_PATH_HASHES])->assertSuccessful();

    // Call up() directly to capture the RuntimeException
    $migration = include database_path('migrations/2026_10_25_233835_recalculate_document_number_hashes.php');

    $threw = false;
    try {
        $migration->up();
    } catch (RuntimeException $e) {
        $threw = true;
        expect($e->getMessage())->toContain('Migration aborted');
    }
    expect($threw)->toBeTrue();

    // Restore schema for teardown
    DB::table('patients')->where('first_names', 'Alice')->orWhere('first_names', 'Bob')->delete();
    Schema::table('patients', fn ($t) => $t->unique('document_number_hash'));
    $this->artisan('migrate', ['--path' => MIGRATION_PATH_HASHES, '--force' => true])->assertSuccessful();
});
