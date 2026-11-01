<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Laboratory orders: ordenada → muestra → ingresado → validada → entregada
     * (or cancelada). Each item keeps the name and price of the analysis at
     * the time of the order; the charge is created when the sample is taken
     * (ADR-018). Results keep a copy of the parameter name and reference.
     */
    public function up(): void
    {
        Schema::create('lab_orders', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->nullable()->unique(); // L-0001
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->string('origin', 20); // consulta | emergencia | internamiento | externo
            $table->foreignId('turn_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('emergency_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('external_doctor')->nullable();
            $table->text('indication')->nullable();
            $table->string('status', 20)->default('ordenada');
            $table->timestamp('ordered_at');
            $table->timestamp('sample_at')->nullable();
            $table->foreignId('sample_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('validated_at')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('cancel_reason')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['status', 'ordered_at']);
        });

        Schema::create('lab_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_order_id')->constrained()->restrictOnDelete();
            $table->foreignId('lab_test_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('category', 40);
            $table->unsignedInteger('price');
            $table->foreignId('account_charge_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('lab_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lab_order_item_id')->constrained()->restrictOnDelete();
            $table->foreignId('lab_test_parameter_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('name');
            $table->string('reference', 80);
            $table->string('value', 80)->nullable();
            $table->boolean('out_of_range')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_results');
        Schema::dropIfExists('lab_order_items');
        Schema::dropIfExists('lab_orders');
    }
};
