<?php

use App\Support\Pii;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Recalculate document_number_hash for all patients using the new
 * type-aware Pii::documentHash normalisation.
 *
 * Old algorithm (Pii::hash with fallbackToFull): digits-only for all types,
 * fallback to full string when no digits exist.
 *
 * Problem: two passports AB123456 and XY123456 both normalised to '123456',
 * producing identical hashes. Same bug affected no_tiene GEN- codes.
 *
 * New algorithm (Pii::documentHash): uses uppercase [A-Z0-9] for pasaporte,
 * cedula_extranjera, and no_tiene, so letters are preserved in the hash input.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::transaction(function () {
            // ── Phase 1: compute new hashes and verify no collisions ──────────────
            /** @var array<string, int> $seen  new_hash → patient_id */
            $seen = [];
            /** @var list<int[]> $conflicts flat list of IDs involved in a collision */
            $conflicts = [];

            DB::table('patients')->orderBy('id')->chunkById(200, function ($rows) use (&$seen, &$conflicts) {
                foreach ($rows as $row) {
                    $plain = Pii::decrypt($row->document_number);
                    if ($plain === null || $plain === '') {
                        continue;
                    }
                    $newHash = Pii::documentHash((string) $row->document_type, $plain);

                    if (isset($seen[$newHash])) {
                        $conflicts[] = $row->id;
                        $conflicts[] = $seen[$newHash];
                    } else {
                        $seen[$newHash] = $row->id;
                    }
                }
            });

            if (! empty($conflicts)) {
                $ids = implode(', ', array_unique($conflicts));
                throw new RuntimeException(
                    "Migration aborted: recalculated document_number_hash would produce duplicates for patient IDs: {$ids}"
                );
            }

            // ── Phase 2: write new hashes ─────────────────────────────────────────
            DB::table('patients')->orderBy('id')->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    $plain = Pii::decrypt($row->document_number);
                    if ($plain === null || $plain === '') {
                        continue;
                    }
                    $newHash = Pii::documentHash((string) $row->document_type, $plain);
                    DB::table('patients')->where('id', $row->id)->update(['document_number_hash' => $newHash]);
                }
            });
        });
    }

    public function down(): void
    {
        // Restore old algorithm: digits-only normalisation, fallback to full string.
        DB::table('patients')->orderBy('id')->chunkById(200, function ($rows) {
            foreach ($rows as $row) {
                $plain = Pii::decrypt($row->document_number);
                if ($plain === null || $plain === '') {
                    continue;
                }
                $digits = preg_replace('/[^\d]/', '', $plain) ?? '';
                $oldHash = $digits !== ''
                    ? hash_hmac('sha256', $digits, config('app.key'))
                    : hash_hmac('sha256', $plain, config('app.key'));

                DB::table('patients')->where('id', $row->id)->update(['document_number_hash' => $oldHash]);
            }
        });
    }
};
