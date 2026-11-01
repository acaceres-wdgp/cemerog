<?php

use App\Models\OperatingRoom;
use App\Models\SurgeryProcedure;
use App\Models\User;
use Database\Seeders\SurgerySeeder;

beforeEach(function () {
    $this->seed(SurgerySeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
});

test('the catalog lists procedures and operating rooms and suggests the next code', function () {
    $this->actingAs($this->admin)
        ->get('/admin/cirugias')
        ->assertInertia(fn ($page) => $page
            ->component('admin-cirugias/index')
            ->has('procedures', 6)
            ->where('procedures.1.name', 'Colecistectomía laparoscópica')
            ->where('procedures.1.price', 5500000)
            ->where('operating_rooms.0.name', 'Quirófano 1')
            ->where('next_code', 'Q-07')
        );
});

test('procedures are added, repriced and deactivated', function () {
    $this->actingAs($this->admin)->post('/admin/cirugias', ['code' => 'q-07', 'name' => 'Tiroidectomía', 'price' => 6000000, 'duration_minutes' => 150])->assertSessionHasNoErrors();
    $p = SurgeryProcedure::where('code', 'Q-07')->firstOrFail();
    expect($p->is_active)->toBeTrue();

    $this->actingAs($this->admin)->put("/admin/cirugias/{$p->id}", ['code' => 'Q-07', 'name' => 'Tiroidectomía total', 'price' => 6500000, 'duration_minutes' => 180, 'is_active' => false]);
    expect($p->fresh()->price)->toBe(6500000)->and($p->fresh()->is_active)->toBeFalse();

    $this->actingAs($this->admin)->post('/admin/cirugias', ['code' => 'Q-01', 'name' => 'x', 'price' => 1, 'duration_minutes' => 60])->assertSessionHasErrors('code');
});

test('operating rooms are added and deactivated', function () {
    $this->actingAs($this->admin)->post('/admin/cirugias/quirofanos', ['name' => 'Quirófano 2'])->assertSessionHasNoErrors();
    $q2 = OperatingRoom::where('name', 'Quirófano 2')->firstOrFail();

    $this->actingAs($this->admin)->put("/admin/cirugias/quirofanos/{$q2->id}", ['name' => 'Quirófano 2', 'is_active' => false]);
    expect($q2->fresh()->is_active)->toBeFalse()
        ->and(OperatingRoom::active()->pluck('name')->all())->toBe(['Quirófano 1']);
});

test('only the administrator manages the catalog', function () {
    $medico = User::factory()->create();
    $medico->assignRole('medico');

    $this->actingAs($medico)->get('/admin/cirugias')->assertForbidden();
});
