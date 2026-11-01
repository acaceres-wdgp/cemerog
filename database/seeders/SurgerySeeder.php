<?php

namespace Database\Seeders;

use App\Models\OperatingRoom;
use App\Models\SurgeryProcedure;
use Illuminate\Database\Seeder;

/** The surgery catalog of the design (prices in centavos), to test Cirugía */
class SurgerySeeder extends Seeder
{
    public function run(): void
    {
        $procedures = [
            ['Q-01', 'Apendicectomía', 3500000, 90],
            ['Q-02', 'Colecistectomía laparoscópica', 5500000, 120],
            ['Q-03', 'Herniorrafia inguinal', 3000000, 90],
            ['Q-04', 'Cesárea', 4500000, 90],
            ['Q-05', 'Legrado uterino', 1200000, 60],
            ['Q-06', 'Circuncisión', 1000000, 60],
        ];
        foreach ($procedures as [$code, $name, $price, $minutes]) {
            SurgeryProcedure::updateOrCreate(['code' => $code], ['name' => $name, 'price' => $price, 'duration_minutes' => $minutes, 'is_active' => true]);
        }
        OperatingRoom::firstOrCreate(['name' => 'Quirófano 1'], ['is_active' => true, 'position' => 1]);

        $this->command->info('Catálogo de cirugías: '.count($procedures).' procedimientos.');
    }
}
