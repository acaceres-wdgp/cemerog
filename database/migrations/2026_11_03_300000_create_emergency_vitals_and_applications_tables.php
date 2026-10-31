<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Each vital-sign reading of an emergency, and each medication or supply
     * applied (from the catalog, or brought by the patient and not charged).
     */
    public function up(): void
    {
        Schema::create('emergency_vitals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emergency_id')->constrained()->restrictOnDelete();
            $table->string('presion_arterial', 10);              // "120/80"
            $table->unsignedSmallInteger('frecuencia_cardiaca');  // bpm
            $table->unsignedSmallInteger('frecuencia_respiratoria'); // rpm
            $table->unsignedSmallInteger('temp');                // °C × 10
            $table->unsignedSmallInteger('saturacion_o2');       // %
            $table->unsignedSmallInteger('glucemia')->nullable(); // mg/dL
            $table->timestamp('taken_at');
            $table->foreignId('taken_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('emergency_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emergency_id')->constrained()->restrictOnDelete();
            $table->string('kind', 20); // medicamento | insumo
            $table->foreignId('inventory_item_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('description');
            $table->unsignedInteger('quantity');
            $table->string('route', 20)->nullable(); // IV, IM, VO…
            $table->unsignedInteger('unit_price')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->boolean('brought_by_patient')->default(false);
            $table->integer('stock_left')->nullable();
            $table->timestamp('applied_at');
            $table->foreignId('applied_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_applications');
        Schema::dropIfExists('emergency_vitals');
    }
};
