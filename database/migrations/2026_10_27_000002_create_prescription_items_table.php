<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('position');
            $table->string('medication');
            $table->string('route')->nullable();
            $table->string('dose');
            $table->string('frequency');
            $table->unsignedSmallInteger('duration_days')->nullable();
            $table->boolean('is_continuous')->default(false);
            $table->unsignedSmallInteger('quantity');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_items');
    }
};
