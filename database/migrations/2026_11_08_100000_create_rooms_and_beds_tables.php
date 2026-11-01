<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Internamiento: room types with their price per day (centavos), rooms
     * and their beds. A bed is libre, ocupada or en limpieza.
     */
    public function up(): void
    {
        Schema::create('room_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40)->unique();
            $table->unsignedInteger('daily_price');
            $table->timestamps();
        });

        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40)->unique(); // Hab. 1
            $table->foreignId('room_type_id')->constrained()->restrictOnDelete();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('beds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->cascadeOnDelete();
            $table->string('name', 30); // Cama única, Cama A
            $table->string('status', 20)->default('libre'); // libre | ocupada | limpieza
            $table->timestamp('cleaning_since')->nullable();
            $table->timestamps();

            $table->unique(['room_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beds');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('room_types');
    }
};
