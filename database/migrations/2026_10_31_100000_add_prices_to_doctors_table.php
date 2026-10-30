<?php

use App\Models\Doctor;
use App\Models\Specialty;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->unsignedInteger('consultation_price')->default(0)->after('is_active');
            $table->unsignedInteger('consultation_fee')->default(0)->after('consultation_price');
        });

        // Initialize consultation_price from the doctor's specialty
        Doctor::with('specialty')->each(function (Doctor $doctor) {
            $doctor->update([
                'consultation_price' => $doctor->specialty->consultation_price ?? 0,
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->dropColumn(['consultation_price', 'consultation_fee']);
        });
    }
};
