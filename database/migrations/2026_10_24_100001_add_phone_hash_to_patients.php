<?php

use App\Models\Patient;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('patients', 'phone_hash')) {
            Schema::table('patients', function (Blueprint $table) {
                $table->string('phone_hash', 64)->nullable()->after('phone')->index();
            });
        }

        // Backfill: recompute document_number_hash (digits-only normalization)
        // and compute phone_hash for all existing patients.
        // Uses raw DB rows to avoid failures on any unencrypted legacy data.
        Patient::withoutTimestamps(function () {
            DB::table('patients')->orderBy('id')->each(function (object $row) {
                $updates = [];

                // Re-hash document_number with digits-only normalization
                try {
                    $rawDoc = decrypt($row->document_number);
                    $digits = preg_replace('/[^\d]/', '', $rawDoc) ?: $rawDoc;
                    $updates['document_number_hash'] = hash_hmac('sha256', $digits, config('app.key'));
                } catch (Throwable) {
                    // Already plain-text or wrong key – skip hash update for this field
                }

                // Compute phone_hash from digits only
                if (! empty($row->phone)) {
                    try {
                        $rawPhone = decrypt($row->phone);
                        $digits = preg_replace('/[^\d]/', '', $rawPhone);
                        if ($digits) {
                            $updates['phone_hash'] = hash_hmac('sha256', $digits, config('app.key'));
                        }
                    } catch (Throwable) {
                        // Skip unencryptable values
                    }
                }

                if ($updates) {
                    DB::table('patients')->where('id', $row->id)->update($updates);
                }
            });
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex(['phone_hash']);
            $table->dropColumn('phone_hash');
        });
    }
};
