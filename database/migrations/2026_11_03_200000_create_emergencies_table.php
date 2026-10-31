<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Emergency attentions. The quick admission registers the minimum, so a
     * patient may come without a birth date and is marked incomplete until
     * Recepción fills in the profile. Charges gain the emergencia and insumo
     * types (the column becomes a plain string, validated in the app).
     */
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->date('birth_date')->nullable()->change();
            $table->boolean('profile_incomplete')->default(false)->after('allergies');
        });

        Schema::table('account_charges', function (Blueprint $table) {
            $table->string('type', 20)->change();
        });

        Schema::create('emergencies', function (Blueprint $table) {
            $table->id();
            $table->string('number', 20)->nullable()->unique();
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained()->restrictOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->foreignId('cubicle_id')->constrained('emergency_cubicles')->restrictOnDelete();
            // Set while the patient is in the cubicle, null after discharge:
            // the unique index allows a single patient per cubicle.
            $table->unsignedBigInteger('occupied_cubicle_id')->nullable()->unique();
            $table->text('reason');
            $table->string('status', 20)->default('activa'); // activa | alta
            $table->timestamp('arrived_at');
            $table->timestamp('discharged_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['status', 'arrived_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emergencies');

        Schema::table('account_charges', function (Blueprint $table) {
            $table->enum('type', ['consulta', 'laboratorio', 'imagen', 'medicamento', 'procedimiento', 'otro'])->change();
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn('profile_incomplete');
            $table->date('birth_date')->nullable(false)->change();
        });
    }
};
