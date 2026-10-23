<?php

use App\Models\User;

/**
 * Users with a temporary password must change it before using settings.
 */
dataset('settings_requests', [
    'settings redirect' => ['get', '/settings'],
    'profile page' => ['get', '/settings/profile'],
    'profile update' => ['patch', '/settings/profile'],
    'profile delete' => ['delete', '/settings/profile'],
    'appearance page' => ['get', '/settings/appearance'],
]);

test('user with temporary password is sent to change it', function (string $method, string $url) {
    $user = User::factory()->mustChangePassword()->create();

    $this->actingAs($user)
        ->{$method}($url, ['name' => 'Changed', 'password' => 'password'])
        ->assertRedirect(route('password.change-required'));
})->with('settings_requests');

test('user with temporary password cannot rename or delete their account', function () {
    $user = User::factory()->mustChangePassword()->create(['name' => 'Original']);

    $this->actingAs($user)->patch('/settings/profile', ['name' => 'Changed']);
    $this->actingAs($user)->delete('/settings/profile', ['password' => 'password']);

    expect($user->fresh())->not->toBeNull()
        ->and($user->fresh()->name)->toBe('Original');
});

test('user with changed password can open settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/settings/profile')->assertOk();
    $this->actingAs($user)->get('/settings/appearance')->assertOk();
});
