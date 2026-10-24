<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The original consultations migration called nullOnDelete() before
 * constrained(), so the turn_id foreign key was created without ON DELETE SET NULL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['turn_id']);
            $table->foreign('turn_id')->references('id')->on('turns')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['turn_id']);
            $table->foreign('turn_id')->references('id')->on('turns');
        });
    }
};
