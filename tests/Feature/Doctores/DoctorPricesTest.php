<?php

use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->givePermissionTo('module.doctores.access');

    $this->specialty = Specialty::factory()->create([
        'name' => 'Medicina General',
        'consultation_price' => 150000, // RD$1,500.00
    ]);
});

// ─── Migration rollback ───────────────────────────────────────────────────────

test('doctor prices migration can be rolled back', function () {
    $migration = '2026_10_31_100000_add_prices_to_doctors_table';

    Artisan::call('migrate:rollback', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasColumn('doctors', 'consultation_price'))->toBeFalse();
    expect(Schema::hasColumn('doctors', 'consultation_fee'))->toBeFalse();

    Artisan::call('migrate', ['--path' => "database/migrations/{$migration}.php"]);
    expect(Schema::hasColumn('doctors', 'consultation_price'))->toBeTrue();
    expect(Schema::hasColumn('doctors', 'consultation_fee'))->toBeTrue();
});

// ─── Doctor price defaults ────────────────────────────────────────────────────

test('creating a doctor stores consultation_price and consultation_fee as integers', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Juan Pérez',
            'specialty_id' => $this->specialty->id,
            'consultation_price' => 150000,
            'consultation_fee' => 20000,
        ])
        ->assertRedirect(route('doctores'));

    $doctor = Doctor::where('name', 'Dr. Juan Pérez')->firstOrFail();
    expect($doctor->consultation_price)->toBe(150000);
    expect($doctor->consultation_fee)->toBe(20000);
    expect($doctor->consultation_price)->toBeInt();
    expect($doctor->consultation_fee)->toBeInt();
});

const PRICE_REQUIRED = 'Escribe el precio de la consulta: no puede ser RD$0.';

/*
 * A consultation is never free: a doctor saved with RD$0 charged every
 * consultation at RD$0, and those charges keep their price forever.
 */
test('a doctor cannot be created without a consultation price or with RD$0', function (array $price) {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Sin Precio',
            'specialty_id' => $this->specialty->id,
            ...$price,
        ])
        ->assertSessionHasErrors(['consultation_price' => PRICE_REQUIRED]);

    expect(Doctor::where('name', 'Dr. Sin Precio')->exists())->toBeFalse();
})->with([
    'sin precio' => [[]],
    'precio vacío' => [['consultation_price' => null]],
    'RD$0' => [['consultation_price' => 0]],
]);

test('the honorarium may be left empty', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Sin Honorario',
            'specialty_id' => $this->specialty->id,
            'consultation_price' => 150000,
        ])
        ->assertSessionHasNoErrors();

    expect(Doctor::where('name', 'Dr. Sin Honorario')->value('consultation_fee'))->toBe(0);
});

test('editing a doctor cannot leave the price at RD$0, but may omit it', function () {
    $doctor = Doctor::factory()->create(['specialty_id' => $this->specialty->id, 'consultation_price' => 150000]);
    $base = ['name' => $doctor->name, 'specialty_id' => $doctor->specialty_id];

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", [...$base, 'consultation_price' => 0])
        ->assertSessionHasErrors(['consultation_price' => PRICE_REQUIRED]);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", $base)
        ->assertSessionHasNoErrors();

    expect($doctor->fresh()->consultation_price)->toBe(150000);
});

test('a specialty price cannot be RD$0 either: new doctors start from it', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores/especialidades', ['name' => 'Gratis', 'consultation_price' => 0])
        ->assertSessionHasErrors(['consultation_price' => 'El precio de consulta debe ser mayor que RD$0.']);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/especialidades/{$this->specialty->id}", ['name' => 'Medicina General', 'consultation_price' => 0])
        ->assertSessionHasErrors(['consultation_price' => 'El precio de consulta debe ser mayor que RD$0.']);
});

test('validation rejects consultation_fee greater than consultation_price', function () {
    $this->actingAs($this->admin)
        ->post('/admin/doctores', [
            'name' => 'Dr. Fee Mayor',
            'specialty_id' => $this->specialty->id,
            'consultation_price' => 100000,
            'consultation_fee' => 150000, // fee > price
        ])
        ->assertSessionHasErrors(['consultation_fee']);
});

test('updating a doctor updates consultation_price and consultation_fee', function () {
    $doctor = Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'consultation_price' => 100000,
        'consultation_fee' => 10000,
    ]);

    $this->actingAs($this->admin)
        ->put("/admin/doctores/{$doctor->id}", [
            'name' => $doctor->name,
            'specialty_id' => $doctor->specialty_id,
            'consultation_price' => 200000,
            'consultation_fee' => 25000,
        ])
        ->assertRedirect(route('doctores'));

    $doctor->refresh();
    expect($doctor->consultation_price)->toBe(200000);
    expect($doctor->consultation_fee)->toBe(25000);
});

test('doctor index sends consultation_price and consultation_fee in props', function () {
    Doctor::factory()->create([
        'specialty_id' => $this->specialty->id,
        'consultation_price' => 180000,
        'consultation_fee' => 30000,
    ]);

    $this->actingAs($this->admin)
        ->get('/admin/doctores')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('doctores/index')
            ->has('doctors', 1, fn ($doctor) => $doctor
                ->where('consultation_price', 180000)
                ->where('consultation_fee', 30000)
                ->etc()
            )
        );
});
