<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * Only the administrator manages passwords: users change theirs only
 * when it is a temporary one.
 */
test('user with temporary password can open the change form', function () {
    $user = User::factory()->mustChangePassword()->create();

    $this->actingAs($user)
        ->get('/password/change-required')
        ->assertOk();
});

test('user with temporary password can change it', function () {
    $user = User::factory()->mustChangePassword()->create();
    $user->assignRole('caja');

    $this->actingAs($user)
        ->post('/password/change-required', [
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ])
        ->assertRedirect(route('inicio', absolute: false));

    $user->refresh();
    expect(Hash::check('newpassword1', $user->password))->toBeTrue()
        ->and($user->must_change_password)->toBeFalse();
});

test('user without temporary password is sent home from the change form', function () {
    $user = User::factory()->create();
    $user->assignRole('bioanalista');

    $this->actingAs($user)
        ->get('/password/change-required')
        ->assertRedirect(route('lab', absolute: false));
});

test('user without temporary password cannot change it', function () {
    $user = User::factory()->create();
    $user->assignRole('bioanalista');

    $this->actingAs($user)
        ->post('/password/change-required', [
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ])
        ->assertRedirect(route('lab', absolute: false));

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});
