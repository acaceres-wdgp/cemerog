<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Clinic settings that change without a release (key/value) and the
     * emergency cubicles, both edited by the administrator.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('emergency_cubicles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->unsignedInteger('position');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Starting point from the design: six cubicles, Observación and an
        // RD$1,500 emergency fee. The administrator can change all of it.
        $now = now();
        DB::table('settings')->insert(['key' => 'emergency_fee', 'value' => '150000', 'created_at' => $now, 'updated_at' => $now]);
        $names = ['Cub. 1', 'Cub. 2', 'Cub. 3', 'Cub. 4', 'Cub. 5', 'Cub. 6', 'Observación'];
        DB::table('emergency_cubicles')->insert(array_map(fn (string $name, int $i): array => [
            'name' => $name,
            'position' => $i + 1,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $names, array_keys($names)));
    }

    public function down(): void
    {
        Schema::dropIfExists('emergency_cubicles');
        Schema::dropIfExists('settings');
    }
};
