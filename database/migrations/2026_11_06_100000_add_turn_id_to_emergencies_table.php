<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The consulta a patient came from when the doctor sent them to emergency */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emergencies', function (Blueprint $table) {
            $table->foreignId('turn_id')->nullable()->after('patient_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('emergencies', function (Blueprint $table) {
            $table->dropConstrainedForeignId('turn_id');
        });
    }
};
