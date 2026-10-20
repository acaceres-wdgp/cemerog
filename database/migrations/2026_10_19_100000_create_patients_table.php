<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('document_type', 20)->default('cedula');
            $table->string('document_number', 30)->unique();
            $table->string('first_names', 100);
            $table->string('last_names', 100);
            $table->date('birth_date');
            $table->char('sex', 1);
            $table->string('phone', 20)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('blood_type', 5)->nullable();
            $table->text('allergies')->nullable();
            $table->string('emergency_contact_name', 100)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
