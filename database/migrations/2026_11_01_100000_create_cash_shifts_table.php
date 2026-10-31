<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('opened_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('opened_at');
            $table->unsignedInteger('opening_amount');
            $table->json('opening_denominations')->nullable();
            $table->enum('status', ['abierto', 'cerrado'])->default('abierto');
            // There is a single cash register: only one shift may be open. Set to
            // true while open and null once closed, so the unique index allows
            // any number of closed shifts but a single open one.
            $table->boolean('open_lock')->nullable()->unique();
            $table->foreignId('closed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->unsignedInteger('expected_cash')->nullable();
            $table->unsignedInteger('counted_cash')->nullable();
            $table->json('counted_denominations')->nullable();
            $table->integer('difference')->nullable();
            $table->text('close_note')->nullable();
            $table->timestamps();
        });

        Schema::create('cash_withdrawals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_shift_id')->constrained('cash_shifts')->restrictOnDelete();
            $table->unsignedInteger('amount');
            $table->string('reason');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_withdrawals');
        Schema::dropIfExists('cash_shifts');
    }
};
