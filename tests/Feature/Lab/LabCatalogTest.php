<?php

use App\Models\LabTest;
use App\Models\User;
use Database\Seeders\LabCatalogSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
    $this->bio = User::factory()->create();
    $this->bio->assignRole('bioanalista');
});

function labTestPayload(array $overrides = []): array
{
    return [
        'code' => '130',
        'name' => 'Glucosa en ayunas',
        'category' => 'Química',
        'preparation' => 'Ayuno de 8 a 12 horas. Puede tomar agua.',
        'price' => 25000,
        'parameters' => [
            ['name' => 'Glucosa en ayunas', 'result_type' => 'numerico', 'unit' => 'mg/dL', 'min' => 70, 'max' => 100],
        ],
        ...$overrides,
    ];
}

test('the administrator creates an analysis with its parameters', function () {
    $this->actingAs($this->admin)
        ->post('/admin/analisis', labTestPayload([
            'code' => '104',
            'name' => 'Hemograma completo',
            'category' => 'Hematología',
            'parameters' => [
                ['name' => 'Leucocitos', 'result_type' => 'numerico', 'unit' => '×10³/µL', 'min' => 4.5, 'max' => 11],
                ['name' => 'Hemoglobina', 'result_type' => 'numerico', 'unit' => 'g/dL', 'min' => 12, 'max' => 16],
            ],
        ]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $test = LabTest::with('parameters')->first();
    expect($test->name)->toBe('Hemograma completo')
        ->and($test->price)->toBe(25000)
        ->and($test->is_active)->toBeTrue()
        ->and($test->parameters->pluck('name')->all())->toBe(['Leucocitos', 'Hemoglobina'])
        ->and($test->parameters[0]->referenceText())->toBe('4.5 – 11 ×10³/µL');
});

test('a text parameter keeps its normal value', function () {
    $this->actingAs($this->admin)
        ->post('/admin/analisis', labTestPayload([
            'code' => '109', 'name' => 'Gestatest', 'category' => 'Serología',
            'parameters' => [['name' => 'Gestatest', 'result_type' => 'texto', 'normal_text' => 'Negativo']],
        ]))
        ->assertSessionHasNoErrors();

    $param = LabTest::first()->parameters()->first();
    expect($param->normal_text)->toBe('NEGATIVO')
        ->and($param->referenceText())->toBe('NEGATIVO')
        ->and($param->isOutOfRange('positivo'))->toBeTrue()
        ->and($param->isOutOfRange('Negativo'))->toBeFalse();
});

test('numeric parameters flag values out of range', function () {
    $this->actingAs($this->admin)->post('/admin/analisis', labTestPayload());
    $param = LabTest::first()->parameters()->first();

    expect($param->isOutOfRange('88'))->toBeFalse()
        ->and($param->isOutOfRange('126'))->toBeTrue()
        ->and($param->isOutOfRange('65,5'))->toBeTrue()
        ->and($param->isOutOfRange(''))->toBeFalse();
});

test('editing replaces the parameters and keeps the code unique', function () {
    $this->actingAs($this->admin)->post('/admin/analisis', labTestPayload());
    $test = LabTest::first();

    $this->actingAs($this->admin)
        ->put("/admin/analisis/{$test->id}", labTestPayload([
            'price' => 30000,
            'is_active' => false,
            'parameters' => [['name' => 'Glucosa', 'result_type' => 'numerico', 'unit' => 'mg/dL', 'min' => 70, 'max' => 110]],
        ]))
        ->assertSessionHasNoErrors();

    $test->refresh();
    expect($test->price)->toBe(30000)
        ->and($test->is_active)->toBeFalse()
        ->and($test->parameters()->count())->toBe(1)
        ->and((float) $test->parameters()->first()->max)->toBe(110.0);

    $this->actingAs($this->admin)
        ->post('/admin/analisis', labTestPayload())
        ->assertSessionHasErrors(['code']);
});

test('an analysis needs a name, a category, a price and at least one parameter', function () {
    $this->actingAs($this->admin)
        ->post('/admin/analisis', ['code' => '', 'name' => '', 'category' => 'Otra', 'price' => -1, 'parameters' => []])
        ->assertSessionHasErrors(['code', 'name', 'category', 'price', 'parameters']);
});

test('the catalog page lists analyses with parameters; only administrators edit', function () {
    $this->actingAs($this->admin)->post('/admin/analisis', labTestPayload());

    $this->actingAs($this->admin)
        ->get('/admin/analisis')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('analisis/index')
            ->has('tests', 1)
            ->where('tests.0.name', 'Glucosa en ayunas')
            ->where('tests.0.parameters.0.reference', '70 – 100 mg/dL')
            ->has('categories', 4)
        );

    $this->actingAs($this->bio)->get('/admin/analisis')->assertForbidden();
    $this->actingAs($this->bio)->post('/admin/analisis', labTestPayload(['code' => '999']))->assertForbidden();
});

test('the lab catalog seeder loads the analyses of the design and can run twice', function () {
    $this->seed(LabCatalogSeeder::class);
    $this->seed(LabCatalogSeeder::class);

    expect(LabTest::count())->toBe(9)
        ->and(LabTest::where('code', '104')->first()->parameters()->count())->toBe(6)
        ->and(LabTest::where('code', '120')->first()->category)->toBe('Uroanálisis');
});

test('the lab catalog migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_05_100000_create_lab_tests_tables.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('lab_tests'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('lab_test_parameters'))->toBeTrue();
});
