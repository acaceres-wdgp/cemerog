<?php

namespace Database\Seeders;

use App\Models\ImagingStudy;
use Illuminate\Database\Seeder;

/** The imaging studies of the design, to test Imágenes. Prices in centavos. */
class ImagingCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $studies = [
            ['I-01', 'Radiografía de tórax PA', 'Radiografía', 'Retirar objetos metálicos del tórax.', 80000],
            ['I-02', 'Sonografía abdominal', 'Sonografía', 'Ayuno de 6 horas.', 150000],
            ['I-03', 'Sonografía pélvica', 'Sonografía', 'Vejiga llena: tomar 1 litro de agua 1 hora antes y no orinar.', 150000],
            ['I-04', 'Sonografía obstétrica', 'Sonografía', 'Vejiga semillena en el primer trimestre.', 120000],
            ['I-05', 'Radiografía de extremidades', 'Radiografía', null, 70000],
        ];

        foreach ($studies as [$code, $name, $modality, $preparation, $price]) {
            ImagingStudy::updateOrCreate(['code' => $code], [
                'name' => $name,
                'modality' => $modality,
                'preparation' => $preparation,
                'price' => $price,
                'is_active' => true,
            ]);
        }

        $this->command->info('Catálogo de imágenes: '.count($studies).' estudios.');
    }
}
