<?php

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
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex(['phone_hash']);
            $table->dropColumn('phone_hash');
        });
    }
};
