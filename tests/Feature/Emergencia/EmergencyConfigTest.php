<?php

use App\Models\EmergencyCubicle;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
    $this->enfermera = User::factory()->create();
    $this->enfermera->assignRole('enfermeria');
});

test('the clinic starts with six cubicles, Observación and the emergency fee', function () {
    expect(EmergencyCubicle::orderBy('position')->pluck('name')->all())
        ->toBe(['Cub. 1', 'Cub. 2', 'Cub. 3', 'Cub. 4', 'Cub. 5', 'Cub. 6', 'Observación'])
        ->and(Setting::emergencyFee())->toBe(150000);
});

test('the administrator sees the emergency settings', function () {
    $this->actingAs($this->admin)
        ->get('/admin/emergencia')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin-emergencia/index')
            ->has('cubicles', 7)
            ->where('cubicles.0.name', 'Cub. 1')
            ->where('cubicles.0.is_active', true)
            ->where('emergency_fee', 150000)
        );
});

test('only an administrator can see or change the emergency settings', function () {
    $this->actingAs($this->enfermera)->get('/admin/emergencia')->assertForbidden();
    $this->actingAs($this->enfermera)->post('/admin/emergencia/cubiculos', ['name' => 'Cub. 7'])->assertForbidden();
    $this->actingAs($this->enfermera)->put('/admin/emergencia/cargo', ['emergency_fee' => 1])->assertForbidden();
});

test('a cubicle is added at the end, without a release', function () {
    $this->actingAs($this->admin)
        ->post('/admin/emergencia/cubiculos', ['name' => 'Cub. 7'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $last = EmergencyCubicle::orderByDesc('position')->first();
    expect($last->name)->toBe('Cub. 7')->and($last->is_active)->toBeTrue();
});

test('cubicle names are unique and required', function () {
    $this->actingAs($this->admin)
        ->post('/admin/emergencia/cubiculos', ['name' => 'Cub. 1'])
        ->assertSessionHasErrors(['name']);
    $this->actingAs($this->admin)
        ->post('/admin/emergencia/cubiculos', ['name' => ''])
        ->assertSessionHasErrors(['name']);
});

test('a cubicle can be renamed and deactivated', function () {
    $cubicle = EmergencyCubicle::where('name', 'Cub. 6')->first();

    $this->actingAs($this->admin)
        ->put("/admin/emergencia/cubiculos/{$cubicle->id}", ['name' => 'Cubículo 6', 'is_active' => false])
        ->assertSessionHasNoErrors();

    expect($cubicle->fresh()->name)->toBe('Cubículo 6')
        ->and($cubicle->fresh()->is_active)->toBeFalse();
});

test('the emergency fee is changed in centavos', function () {
    $this->actingAs($this->admin)
        ->put('/admin/emergencia/cargo', ['emergency_fee' => 200000])
        ->assertSessionHasNoErrors();

    expect(Setting::emergencyFee())->toBe(200000);

    $this->actingAs($this->admin)
        ->put('/admin/emergencia/cargo', ['emergency_fee' => -1])
        ->assertSessionHasErrors(['emergency_fee']);
});

test('the emergency settings migration can be rolled back', function () {
    $path = 'database/migrations/2026_11_03_100000_create_settings_and_emergency_cubicles_tables.php';

    $this->artisan('migrate:rollback', ['--path' => $path])->assertSuccessful();
    expect(Schema::hasTable('settings'))->toBeFalse()
        ->and(Schema::hasTable('emergency_cubicles'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $path, '--force' => true])->assertSuccessful();
    expect(EmergencyCubicle::count())->toBe(7);
});
