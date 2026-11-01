<?php

namespace Database\Seeders;

use App\Models\LabTest;
use Illuminate\Database\Seeder;

/**
 * Analyses of the design to try Laboratorio. Safe to run more than once.
 *
 *   php artisan db:seed --class=LabCatalogSeeder --force
 */
class LabCatalogSeeder extends Seeder
{
    /** code => [name, category, preparation, price RD$, [[name, unit|normal, min, max]]] (null min/max = text) */
    private const TESTS = [
        '104' => ['Hemograma completo', 'Hematología', 'No requiere ayuno.', 300, [
            ['Leucocitos', '×10³/µL', 4.5, 11], ['Neutrófilos', '%', 40, 70], ['Linfocitos', '%', 20, 40],
            ['Hemoglobina', 'g/dL', 12, 16], ['Hematocrito', '%', 36, 46], ['Plaquetas', '×10³/µL', 150, 450],
        ]],
        '118' => ['Eritrosedimentación', 'Hematología', 'No requiere ayuno.', 200, [['Eritrosedimentación', 'mm/h', 0, 20]]],
        '130' => ['Glucosa en ayunas', 'Química', 'Ayuno de 8 a 12 horas. Puede tomar agua.', 250, [['Glucosa en ayunas', 'mg/dL', 70, 100]]],
        '131' => ['Creatinina', 'Química', 'Ayuno de 8 horas recomendado.', 300, [['Creatinina', 'mg/dL', 0.7, 1.3]]],
        '107' => ['PCR', 'Serología', 'No requiere ayuno.', 200, [['Proteína C reactiva (PCR)', 'mg/L', null, 6]]],
        '105' => ['ASO', 'Serología', 'No requiere ayuno.', 350, [['Antiestreptolisina O (ASO)', 'UI/mL', null, 200]]],
        '109' => ['Gestatest', 'Serología', 'Traer la primera orina de la mañana en frasco estéril.', 300, [['Gestatest', 'NEGATIVO']]],
        '112' => ['Reacción de Widal', 'Serología', 'No requiere ayuno.', 400, [
            ['Tífico O', 'NEGATIVO'], ['Tífico H', 'NEGATIVO'], ['Paratífico A', 'NEGATIVO'], ['Paratífico B', 'NEGATIVO'],
        ]],
        '120' => ['Examen de orina', 'Uroanálisis', 'Primera orina de la mañana, previo aseo genital. Recoger el chorro medio en frasco estéril.', 250, [
            ['Color', 'AMARILLO'], ['Aspecto', 'CLARO'], ['pH', '', 5, 8], ['Densidad', '', 1.005, 1.03],
            ['Leucocitos', '/campo', 0, 5], ['Nitritos', 'NEGATIVO'],
        ]],
    ];

    public function run(): void
    {
        foreach (self::TESTS as $code => [$name, $category, $preparation, $price, $parameters]) {
            if (LabTest::where('code', (string) $code)->exists()) {
                continue;
            }

            $test = LabTest::create([
                'code' => (string) $code,
                'name' => $name,
                'category' => $category,
                'preparation' => $preparation,
                'price' => $price * 100,
                'is_active' => true,
            ]);

            foreach ($parameters as $i => $p) {
                $text = count($p) === 2;
                $test->parameters()->create([
                    'position' => $i + 1,
                    'name' => $p[0],
                    'result_type' => $text ? 'texto' : 'numerico',
                    'unit' => $text || $p[1] === '' ? null : $p[1],
                    'min' => $text ? null : $p[2],
                    'max' => $text ? null : $p[3],
                    'normal_text' => $text ? $p[1] : null,
                ]);
            }
        }
    }
}
