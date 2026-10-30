<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discharges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turn_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained()->restrictOnDelete();
            $table->enum('type', ['recuperado', 'traslado', 'defuncion']);
            $table->string('destination')->nullable();
            $table->string('reason')->nullable();
            $table->text('discharge_diagnosis');
            $table->timestamp('discharged_at')->useCurrent();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discharges');
    }
};
