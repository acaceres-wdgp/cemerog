<?php

use App\Models\ImagingStudy;
use App\Models\LabTest;
use App\Models\StudyCategory;
use App\Models\User;
use Database\Seeders\ImagingCatalogSeeder;
use Database\Seeders\LabCatalogSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->seed([LabCatalogSeeder::class, ImagingCatalogSeeder::class]);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
});

function category(string $kind, string $name): StudyCategory
{
    return StudyCategory::where('kind', $kind)->where('name', $name)->firstOrFail();
}

test('the catalogs start with the current categories and modalities, with their use', function () {
    expect(StudyCategory::names('laboratorio'))->toBe(['Hematología', 'Química', 'Serología', 'Uroanálisis'])
        ->and(StudyCategory::names('imagen'))->toBe(['Radiografía', 'Sonografía', 'Tomografía', 'Mamografía', 'Otro']);

    $this->actingAs($this->admin)
        ->get('/admin/analisis')
        ->assertInertia(fn ($page) => $page
            ->where('categories', StudyCategory::names('laboratorio'))
            ->where('category_items.1.name', 'Química')
            ->where('category_items.1.count', LabTest::where('category', 'Química')->count())
        );

    $this->actingAs($this->admin)
        ->get('/admin/imagenes-catalogo')
        ->assertInertia(fn ($page) => $page->where('modality_items.2', ['id' => category('imagen', 'Tomografía')->id, 'name' => 'Tomografía', 'count' => 0]));
});

test('a new category is added at the end and can be used for an analysis', function () {
    $this->actingAs($this->admin)
        ->post('/admin/analisis/categorias', ['name' => '  Inmunología '])
        ->assertSessionHasNoErrors();

    expect(StudyCategory::names('laboratorio'))->toBe(['Hematología', 'Química', 'Serología', 'Uroanálisis', 'Inmunología']);

    $this->actingAs($this->admin)
        ->post('/admin/analisis', [
            'code' => '200', 'name' => 'IgE total', 'category' => 'Inmunología', 'price' => 90000,
            'parameters' => [['name' => 'IgE', 'result_type' => 'numerico', 'unit' => 'UI/mL', 'min' => 0, 'max' => 100]],
        ])
        ->assertSessionHasNoErrors();
    expect(LabTest::where('code', '200')->value('category'))->toBe('Inmunología');
});

test('names are required and unique within their kind', function () {
    $this->actingAs($this->admin)->post('/admin/analisis/categorias', ['name' => ''])->assertSessionHasErrors('name');
    $this->actingAs($this->admin)->post('/admin/analisis/categorias', ['name' => 'Química'])->assertSessionHasErrors('name');
    // Same name in the other kind is fine
    $this->actingAs($this->admin)->post('/admin/imagenes-catalogo/modalidades', ['name' => 'Química'])->assertSessionHasNoErrors();
});

test('renaming a category renames it in the catalog', function () {
    $quimica = category('laboratorio', 'Química');
    $n = LabTest::where('category', 'Química')->count();

    $this->actingAs($this->admin)
        ->put("/admin/analisis/categorias/{$quimica->id}", ['name' => 'Química clínica'])
        ->assertSessionHasNoErrors();

    expect(LabTest::where('category', 'Química clínica')->count())->toBe($n)
        ->and(LabTest::where('category', 'Química')->count())->toBe(0);

    $sono = category('imagen', 'Sonografía');
    $this->actingAs($this->admin)->put("/admin/imagenes-catalogo/modalidades/{$sono->id}", ['name' => 'Ultrasonido']);
    expect(ImagingStudy::where('modality', 'Ultrasonido')->count())->toBe(3);
});

test('categories are reordered one step at a time', function () {
    $sero = category('laboratorio', 'Serología');

    $this->actingAs($this->admin)->post("/admin/analisis/categorias/{$sero->id}/mover", ['direction' => 'up']);
    expect(StudyCategory::names('laboratorio'))->toBe(['Hematología', 'Serología', 'Química', 'Uroanálisis']);

    $first = category('laboratorio', 'Hematología');
    $this->actingAs($this->admin)->post("/admin/analisis/categorias/{$first->id}/mover", ['direction' => 'up']);
    expect(StudyCategory::names('laboratorio')[0])->toBe('Hematología');
});

test('only unused categories are deleted', function () {
    $quimica = category('laboratorio', 'Química');
    $this->actingAs($this->admin)
        ->delete("/admin/analisis/categorias/{$quimica->id}")
        ->assertSessionHasErrors('category');

    $tomo = category('imagen', 'Tomografía');
    $this->actingAs($this->admin)->delete("/admin/imagenes-catalogo/modalidades/{$tomo->id}")->assertSessionHasNoErrors();
    expect(StudyCategory::names('imagen'))->not->toContain('Tomografía');
});

test('each catalog manages only its own kind, and only with its permission', function () {
    $quimica = category('laboratorio', 'Química');
    $this->actingAs($this->admin)
        ->put("/admin/imagenes-catalogo/modalidades/{$quimica->id}", ['name' => 'X'])
        ->assertNotFound();

    $medico = User::factory()->create();
    $medico->assignRole('medico');
    $this->actingAs($medico)->post('/admin/analisis/categorias', ['name' => 'X'])->assertForbidden();
});

test('the study categories migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_07_100000_create_study_categories_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('study_categories'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(StudyCategory::count())->toBe(9);
});
