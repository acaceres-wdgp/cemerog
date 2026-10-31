<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receipts', function (Blueprint $table) {
            $table->id();
            // R-0001, assigned from the id right after insert
            $table->string('number')->nullable()->unique();
            $table->foreignId('invoice_id')->constrained('invoices')->restrictOnDelete();
            $table->foreignId('cash_shift_id')->constrained('cash_shifts')->restrictOnDelete();
            $table->unsignedInteger('total');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('voided_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->timestamps();
        });

        // One line per payment method of a receipt (a receipt can be mixed)
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receipt_id')->constrained('receipts')->cascadeOnDelete();
            $table->enum('method', ['efectivo', 'tarjeta', 'transferencia']);
            $table->unsignedInteger('amount');
            // Cash: what the patient handed over and the change given back
            $table->unsignedInteger('cash_received')->nullable();
            $table->unsignedInteger('change_given')->nullable();
            // Transfer number (required) or card approval code (optional)
            $table->string('reference')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('receipts');
    }
};
