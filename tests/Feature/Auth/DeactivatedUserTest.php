<?php

use App\Models\Specialty;
use App\Models\User;

/**
 * Deactivating a user ends any session they already have open.
 */
dataset('authenticated_pages', [
    'module' => ['/inicio'],
    'no modules' => ['/sin-modulos'],
    'password change' => ['/password/change-required'],
]);

test('deactivated user is logged out on their next request', function (string $url) {
    $user = User::factory()->create();
    $user->assignRole('administrador');
    $this->actingAs($user);

    $user->update(['is_active' => false]);

    $this->get($url)
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors(['username' => 'Tu cuenta está desactivada. Contacta al administrador.']);

    $this->assertGuest();
})->with('authenticated_pages');

test('deactivated user cannot write', function () {
    $user = User::factory()->inactive()->create();
    $user->assignRole('administrador');

    $this->actingAs($user)
        ->post('/admin/doctores/especialidades', ['name' => 'Neurología', 'consultation_price' => 150000])
        ->assertRedirect(route('login'));

    expect(Specialty::where('name', 'Neurología')->exists())->toBeFalse();
    $this->assertGuest();
});

test('active user keeps their session', function () {
    $user = User::factory()->create();
    $user->assignRole('administrador');

    $this->actingAs($user)->get('/inicio')->assertOk();

    $this->assertAuthenticatedAs($user);
});

test('guest pages are unaffected', function () {
    $this->get('/login')->assertOk();
});
