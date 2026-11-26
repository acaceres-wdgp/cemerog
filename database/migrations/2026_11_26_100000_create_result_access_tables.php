<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Portal de resultados: the codes patients use to see their lab and imaging
 * results, and the log of every access to that health data (never deleted).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('result_access_codes', function (Blueprint $table) {
            $table->id();
            // The «atención» is the patient's account of the day
            $table->foreignId('account_id')->constrained('accounts')->restrictOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            // sha256(code . app key); the plain code is never stored
            $table->string('code_hash', 64)->unique();
            // Only to reprint it (Eloquent «encrypted» cast)
            $table->text('code_encrypted');
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['account_id', 'revoked_at']);
        });

        Schema::create('result_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('result_access_code_id')->nullable()->constrained('result_access_codes')->nullOnDelete();
            $table->string('ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            // login_ok, login_fail, locked, view, download_pdf, download_image, download_all
            $table->string('event', 20);
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['result_access_code_id', 'event']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('result_access_logs');
        Schema::dropIfExists('result_access_codes');
    }
};
