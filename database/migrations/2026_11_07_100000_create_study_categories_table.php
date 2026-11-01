<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Editable categories of the laboratory catalog and modalities of the
     * imaging catalog (they were fixed in code). The catalogs keep the name
     * as text, so a rename updates them. Starts with the current values.
     */
    public function up(): void
    {
        Schema::create('study_categories', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 20); // laboratorio | imagen
            $table->string('name', 40);
            $table->unsignedSmallInteger('position');
            $table->timestamps();

            $table->unique(['kind', 'name']);
        });

        $now = now();
        $rows = [];
        foreach (['laboratorio' => ['Hematología', 'Química', 'Serología', 'Uroanálisis'],
            'imagen' => ['Radiografía', 'Sonografía', 'Tomografía', 'Mamografía', 'Otro']] as $kind => $names) {
            foreach ($names as $i => $name) {
                $rows[] = ['kind' => $kind, 'name' => $name, 'position' => $i + 1, 'created_at' => $now, 'updated_at' => $now];
            }
        }
        DB::table('study_categories')->insert($rows);
    }

    public function down(): void
    {
        Schema::dropIfExists('study_categories');
    }
};
