<?php

use App\Models\User;

/**
 * Access and passwords are managed only by the administrator,
 * so there are no self-service security settings.
 */
test('security settings page does not exist', function () {
    $this->actingAs(User::factory()->create())
        ->get('/settings/security')
        ->assertNotFound();
});

test('self-service password update endpoint does not exist', function () {
    $this->actingAs(User::factory()->create())
        ->put('/settings/password', [
            'current_password' => 'password',
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ])
        ->assertNotFound();
});

test('passkey well-known endpoint does not exist', function () {
    $this->get('/.well-known/passkey-endpoints')->assertNotFound();
});
