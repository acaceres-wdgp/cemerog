<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cirugía: operating rooms (starts with «Quirófano 1»), the catalog of
     * procedures with price and estimated duration, and the surgeries
     * (programada → quirofano → realizada, or cancelada). The surgery keeps
     * the name and price of the procedure; it is charged when performed
     * (ADR-024).
     */
    public function up(): void
    {
        Schema::create('operating_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });
        DB::table('operating_rooms')->insert(['name' => 'Quirófano 1', 'is_active' => true, 'position' => 1, 'created_at' => now(), 'updated_at' => now()]);

        Schema::create('surgery_procedures', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique(); // Q-01
            $table->string('name');
            $table->unsignedInteger('price');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('surgeries', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->nullable()->unique(); // Q-000001
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('surgery_procedure_id')->constrained()->restrictOnDelete();
            $table->string('procedure_name');
            $table->unsignedInteger('price');
            $table->foreignId('operating_room_id')->constrained()->restrictOnDelete();
            $table->foreignId('surgeon_id')->constrained('doctors')->restrictOnDelete();
            $table->foreignId('anesthetist_id')->nullable()->constrained('doctors')->restrictOnDelete();
            $table->foreignId('admission_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->string('status', 20)->default('programada');
            $table->text('notes')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('performed_at')->nullable();
            $table->foreignId('account_charge_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('cancel_reason')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['operating_room_id', 'starts_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('surgeries');
        Schema::dropIfExists('surgery_procedures');
        Schema::dropIfExists('operating_rooms');
    }
};
