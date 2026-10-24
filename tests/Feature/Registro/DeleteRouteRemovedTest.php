<?php

use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\Schema;

// B1 – DELETE route no longer exists
test('DELETE /registro/pacientes/{id} no existe (404 o 405)', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.registro.access');
    $patient = Patient::factory()->create();

    $response = $this->actingAs($user)
        ->delete("/registro/pacientes/{$patient->id}");

    expect($response->status())->toBeIn([404, 405]);
});

// B2 – patients table has no deleted_at or is_active
test('la tabla patients no tiene columnas deleted_at ni is_active', function () {
    $columns = Schema::getColumnListing('patients');
    expect($columns)->not->toContain('deleted_at');
    expect($columns)->not->toContain('is_active');
});

// Verify old search route still works (min 3 chars check)
test('ruta de búsqueda en registro devuelve vacío con menos de 3 chars', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('module.registro.access');

    $this->actingAs($user)
        ->getJson('/registro/pacientes/buscar?q=ab')
        ->assertOk()
        ->assertExactJson([]);
});
