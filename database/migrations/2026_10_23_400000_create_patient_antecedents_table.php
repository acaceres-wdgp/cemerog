<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_antecedents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->text('personales')->nullable();
            $table->text('quirurgicos')->nullable();
            $table->text('medicamentos')->nullable();
            $table->text('familiares')->nullable();
            $table->text('alergias')->nullable();
            $table->timestamps();

            $table->unique('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_antecedents');
    }
};
