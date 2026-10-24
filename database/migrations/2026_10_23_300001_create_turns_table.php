<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('turn_number');
            $table->unsignedInteger('turn_order');
            $table->string('status')->default('espera'); // espera, en_consulta, atendido, no_asistio
            $table->timestamp('arrived_at')->useCurrent();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['doctor_id', 'arrived_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('turns');
    }
};
