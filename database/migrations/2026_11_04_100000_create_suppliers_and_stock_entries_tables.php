<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Goods entries. Each item is a single catalog entry with a global stock;
     * each entry says which supplier it came from and at what cost, and the
     * last cost of every supplier is kept per item. Lot and expiry are those of
     * the latest entry (simple on purpose). Adjustments record physical counts,
     * waste and expired goods.
     */
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('rnc', 20)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('contact')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->unsignedInteger('cost')->nullable()->after('price'); // last cost, centavos
            $table->string('lot', 40)->nullable()->after('min_stock');
            $table->date('expires_on')->nullable()->after('lot');        // first day of the month
        });

        Schema::create('inventory_item_supplier', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('last_cost');
            $table->date('last_entry_on');
            $table->timestamps();

            $table->unique(['inventory_item_id', 'supplier_id']);
        });

        Schema::create('stock_entries', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->nullable()->unique(); // ENT-0001
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->string('invoice_ref', 60)->nullable();      // supplier invoice / NCF
            $table->date('received_on');
            $table->unsignedInteger('units')->default(0);
            $table->unsignedBigInteger('total_cost')->default(0);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('stock_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_entry_id')->constrained()->restrictOnDelete();
            $table->foreignId('inventory_item_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->string('lot', 40)->nullable();
            $table->date('expires_on')->nullable();
            $table->unsignedInteger('unit_cost');
            $table->unsignedBigInteger('subtotal');
            $table->timestamps();
        });

        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->restrictOnDelete();
            $table->integer('stock_before');
            $table->integer('quantity'); // signed difference
            $table->string('reason', 20); // conteo | merma | vencido
            $table->string('note')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('stock_entry_lines');
        Schema::dropIfExists('stock_entries');
        Schema::dropIfExists('inventory_item_supplier');
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn(['cost', 'lot', 'expires_on']);
        });
        Schema::dropIfExists('suppliers');
    }
};
