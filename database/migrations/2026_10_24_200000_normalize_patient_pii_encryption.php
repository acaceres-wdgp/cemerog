<?php

use App\Support\Pii;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Data migration: re-encrypt all PII columns using Crypt::encryptString (no serialization).
 *
 * Handles three legacy formats that may exist in the database:
 *   1. encryptString (already correct – still re-written for consistency)
 *   2. encrypt() serialized
 *   3. Double-encrypted
 *
 * Skips any row whose value cannot be recovered and logs it instead of aborting.
 * Not reversible.
 */
return new class extends Migration
{
    public function up(): void
    {
        $normalized = 0;
        $skipped = 0;

        DB::table('patients')->orderBy('id')->chunk(200, function ($rows) use (&$normalized, &$skipped) {
            foreach ($rows as $row) {
                $updates = [];

                // ── phone ─────────────────────────────────────────────────────
                if ($row->phone !== null) {
                    try {
                        $plain = Pii::decrypt($row->phone);
                        $updates['phone'] = Pii::encrypt($plain);
                        $updates['phone_hash'] = Pii::hash($plain);
                    } catch (RuntimeException $e) {
                        Log::warning("PII normalize: patient_id={$row->id} phone: {$e->getMessage()}");
                        $skipped++;
                    }
                }

                // ── document_number ───────────────────────────────────────────
                if ($row->document_number !== null) {
                    try {
                        $plain = Pii::decrypt($row->document_number);
                        $updates['document_number'] = Pii::encrypt($plain);
                        $updates['document_number_hash'] = Pii::hash($plain, fallbackToFull: true);
                    } catch (RuntimeException $e) {
                        Log::warning("PII normalize: patient_id={$row->id} document_number: {$e->getMessage()}");
                        $skipped++;
                    }
                }

                // ── email ─────────────────────────────────────────────────────
                // Email uses the 'encrypted' cast (encryptString) so it should already be
                // in the correct format. Re-encrypt defensively just in case.
                /** @var string|null $email */
                $email = $row->email ?? null;
                if ($email !== null) {
                    try {
                        $plain = Pii::decrypt($email);
                        if ($plain !== null) {
                            $updates['email'] = Crypt::encryptString($plain);
                        }
                    } catch (RuntimeException) {
                        // Email is optional – skip silently
                    }
                }

                if (! empty($updates)) {
                    DB::table('patients')->where('id', $row->id)->update($updates);
                    $normalized++;
                }
            }
        });

        $msg = "PII normalization: {$normalized} records updated, {$skipped} could not be recovered (see logs).";

        Log::info($msg);
    }

    public function down(): void
    {
        // Not reversible.
    }
};
