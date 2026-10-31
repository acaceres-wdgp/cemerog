<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** A discharge closes either a consultation turn or an emergency */
    public function up(): void
    {
        Schema::table('discharges', function (Blueprint $table) {
            $table->unsignedBigInteger('turn_id')->nullable()->change();
            $table->foreignId('emergency_id')->nullable()->unique()->after('turn_id')->constrained()->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('discharges', function (Blueprint $table) {
            $table->dropUnique(['emergency_id']);
            $table->dropConstrainedForeignId('emergency_id');
            $table->unsignedBigInteger('turn_id')->nullable(false)->change();
        });
    }
};
