<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Imaging orders, one per study: ordenada → realizado → borrador →
     * listo → entregado (or cancelada). The order keeps the name, modality
     * and price of the study; the charge is created when the study is
     * performed (ADR-018). The report (findings and conclusion) lives here.
     */
    public function up(): void
    {
        Schema::create('imaging_orders', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->nullable()->unique(); // I-0001
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('imaging_study_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('modality', 40);
            $table->unsignedInteger('price');
            $table->string('origin', 20); // consulta | emergencia | internamiento | externo
            $table->foreignId('turn_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('emergency_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('external_doctor')->nullable();
            $table->text('indication')->nullable();
            $table->string('status', 20)->default('ordenada');
            $table->timestamp('ordered_at');
            $table->timestamp('performed_at')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->foreignId('account_charge_id')->nullable()->constrained()->nullOnDelete();
            $table->text('findings')->nullable();
            $table->text('conclusion')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->foreignId('signed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->string('cancel_reason')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['status', 'ordered_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('imaging_orders');
    }
};
