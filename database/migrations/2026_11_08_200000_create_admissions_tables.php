<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Internamiento. An admission keeps one account open for the whole stay
     * (ADR-023); each bed it occupies is a stay segment with the price per
     * day of that moment, used to charge the room at discharge. Vitals and
     * applications reuse the emergency tables (one of the two ids is set);
     * nursing notes are new.
     */
    public function up(): void
    {
        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->nullable()->unique(); // IN-000001
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->foreignId('bed_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained()->restrictOnDelete();
            $table->string('origin', 20); // emergencia | consulta | directo
            $table->foreignId('emergency_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('turn_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('diagnosis_code', 10);
            $table->string('diagnosis_label');
            $table->text('treatment')->nullable();
            $table->string('status', 20)->default('internado'); // internado | alta
            $table->timestamp('admitted_at');
            $table->timestamp('discharged_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['status', 'patient_id']);
        });

        Schema::create('admission_stays', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bed_id')->constrained()->restrictOnDelete();
            $table->string('bed_label'); // Hab. 2 · Cama A
            $table->string('room_type', 40);
            $table->unsignedInteger('daily_price');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->string('reason')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('admission_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admission_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->string('shift', 10); // mañana | tarde | noche
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        foreach (['emergency_vitals', 'emergency_applications'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->unsignedBigInteger('emergency_id')->nullable()->change();
                $table->foreignId('admission_id')->nullable()->after('emergency_id')->constrained()->restrictOnDelete();
            });
        }

        Schema::table('discharges', function (Blueprint $table) {
            $table->foreignId('admission_id')->nullable()->unique()->after('emergency_id')->constrained()->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('discharges', function (Blueprint $table) {
            $table->dropUnique(['admission_id']);
            $table->dropConstrainedForeignId('admission_id');
        });
        foreach (['emergency_vitals', 'emergency_applications'] as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropConstrainedForeignId('admission_id');
                $table->unsignedBigInteger('emergency_id')->nullable(false)->change();
            });
        }
        Schema::dropIfExists('admission_notes');
        Schema::dropIfExists('admission_stays');
        Schema::dropIfExists('admissions');
    }
};
