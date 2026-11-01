<?php

use App\Models\ImagingStudy;
use App\Models\User;
use Database\Seeders\ImagingCatalogSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
    $this->tecnico = User::factory()->create();
    $this->tecnico->assignRole('imagenes');
});

function studyPayload(array $overrides = []): array
{
    return [
        'code' => 'I-06',
        'name' => 'Tomografía de cráneo simple',
        'modality' => 'Tomografía',
        'preparation' => 'Retirar objetos metálicos de la cabeza.',
        'price' => 450000,
        ...$overrides,
    ];
}

test('the catalog lists the studies with modalities and suggests the next code', function () {
    $this->seed(ImagingCatalogSeeder::class);

    $this->actingAs($this->admin)
        ->get('/admin/imagenes-catalogo')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('imgcat/index')
            ->has('studies', 5)
            ->where('studies.0.code', 'I-01')
            ->where('studies.0.price', 80000)
            ->where('modalities', ImagingStudy::MODALITIES)
            ->where('next_code', 'I-06')
        );
});

test('the administrator creates a study, active by default', function () {
    $this->actingAs($this->admin)
        ->post('/admin/imagenes-catalogo', studyPayload(['code' => 'i-06']))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $study = ImagingStudy::firstOrFail();
    expect($study->code)->toBe('I-06')
        ->and($study->modality)->toBe('Tomografía')
        ->and($study->price)->toBe(450000)
        ->and($study->is_active)->toBeTrue();
});

test('the administrator edits the price and deactivates a study', function () {
    $this->seed(ImagingCatalogSeeder::class);
    $study = ImagingStudy::where('code', 'I-02')->first();

    $this->actingAs($this->admin)
        ->put("/admin/imagenes-catalogo/{$study->id}", studyPayload([
            'code' => 'I-02', 'name' => 'Sonografía abdominal', 'modality' => 'Sonografía',
            'price' => 160000, 'is_active' => false,
        ]))
        ->assertSessionHasNoErrors();

    expect($study->fresh()->price)->toBe(160000)
        ->and($study->fresh()->is_active)->toBeFalse();
});

test('code is unique, modality must be known and price is required', function () {
    $this->seed(ImagingCatalogSeeder::class);

    $this->actingAs($this->admin)
        ->post('/admin/imagenes-catalogo', studyPayload(['code' => 'I-01', 'modality' => 'Resonancia', 'price' => '']))
        ->assertSessionHasErrors(['code', 'modality', 'price']);
});

test('only users with the catalog permission can manage it', function () {
    $this->actingAs($this->tecnico)->get('/admin/imagenes-catalogo')->assertForbidden();
    $this->actingAs($this->tecnico)->post('/admin/imagenes-catalogo', studyPayload())->assertForbidden();
});

test('the imaging studies migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_06_200000_create_imaging_studies_table.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('imaging_studies'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('imaging_studies'))->toBeTrue();
});
