<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * At close the cashier also checks card income against the card terminal
     * report and transfers against the bank statement (centavos).
     */
    public function up(): void
    {
        Schema::table('cash_shifts', function (Blueprint $table) {
            $table->unsignedInteger('counted_card')->nullable()->after('counted_denominations');
            $table->unsignedInteger('counted_transfer')->nullable()->after('counted_card');
        });
    }

    public function down(): void
    {
        Schema::table('cash_shifts', function (Blueprint $table) {
            $table->dropColumn(['counted_card', 'counted_transfer']);
        });
    }
};
