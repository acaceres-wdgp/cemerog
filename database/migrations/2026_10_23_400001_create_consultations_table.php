<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained()->restrictOnDelete();
            $table->foreignId('turn_id')->nullable()->nullOnDelete()->constrained('turns');

            // Vitals
            $table->unsignedSmallInteger('peso')->nullable();        // kg * 10 (e.g. 703 = 70.3 kg)
            $table->unsignedSmallInteger('talla')->nullable();       // cm
            $table->unsignedSmallInteger('temp')->nullable();        // °C * 10
            $table->string('presion_arterial', 10)->nullable();      // e.g. "120/80"
            $table->unsignedSmallInteger('frecuencia_cardiaca')->nullable();  // bpm
            $table->unsignedSmallInteger('frecuencia_respiratoria')->nullable(); // rpm
            $table->unsignedSmallInteger('saturacion_o2')->nullable(); // %
            $table->unsignedSmallInteger('glucemia')->nullable();    // mg/dL

            // Clinical note
            $table->text('motivo_consulta')->nullable();
            $table->text('historia_enfermedad')->nullable();
            $table->text('examen_fisico')->nullable();
            $table->json('diagnosticos')->nullable();   // [{code, label}]
            $table->text('plan_tratamiento')->nullable();

            $table->timestamp('consulted_at')->useCurrent();
            $table->timestamps();

            $table->index(['doctor_id', 'consulted_at']);
            $table->index(['patient_id', 'consulted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
