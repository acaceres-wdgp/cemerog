<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catalog of laboratory analyses. Each analysis has parameters with their
     * reference: a numeric range (min–max and unit) or a normal text value
     * («NEGATIVO»). Prices in centavos.
     */
    public function up(): void
    {
        Schema::create('lab_tests', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->string('category', 40);
            $table->text('preparation')->nullable();
            $table->unsignedInteger('price');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('lab_test_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_test_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('name');
            $table->string('result_type', 10); // numerico | texto
            $table->string('unit', 30)->nullable();
            $table->decimal('min', 12, 3)->nullable();
            $table->decimal('max', 12, 3)->nullable();
            $table->string('normal_text', 60)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_test_parameters');
        Schema::dropIfExists('lab_tests');
    }
};
