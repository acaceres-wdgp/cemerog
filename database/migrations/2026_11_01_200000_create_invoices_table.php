<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            // F-0000001, assigned from the id right after insert
            $table->string('number')->nullable()->unique();
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->enum('status', ['pendiente', 'pagada', 'anulada'])->default('pendiente');
            $table->unsignedInteger('subtotal');
            $table->enum('discount_type', ['porcentaje', 'monto'])->nullable();
            $table->unsignedInteger('discount_value')->nullable();
            $table->unsignedInteger('discount_amount')->default(0);
            $table->string('discount_reason')->nullable();
            $table->unsignedInteger('total');
            $table->unsignedInteger('paid_amount')->default(0);
            // Fiscal receipt number (DGII); not used yet
            $table->string('ncf')->nullable();
            $table->date('credit_due_date')->nullable();
            $table->text('credit_note')->nullable();
            $table->foreignId('issued_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('issued_at');
            $table->foreignId('voided_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamps();

            $table->index(['status', 'issued_at']);
        });

        Schema::create('invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('account_charge_id')->nullable()->constrained('account_charges')->restrictOnDelete();
            $table->string('type');
            $table->string('description');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('total');
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->restrictOnDelete();
            // Doctor fee after the invoice discount, in proportion
            $table->unsignedInteger('doctor_fee')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_lines');
        Schema::dropIfExists('invoices');
    }
};
