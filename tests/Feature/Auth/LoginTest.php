<?php

use App\Models\User;

test('login page renders', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('auth/login'));
});

test('user can login with username and password', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'password' => bcrypt('password123'),
        'is_active' => true,
        'must_change_password' => false,
    ]);

    $this->post('/login', [
        'username' => 'testuser',
        'password' => 'password123',
    ])->assertRedirect(route('inicio'));

    $this->assertAuthenticatedAs($user);
});

test('inactive user cannot login', function () {
    User::factory()->inactive()->create([
        'username' => 'inactive_user',
        'password' => bcrypt('password'),
    ]);

    $this->post('/login', [
        'username' => 'inactive_user',
        'password' => 'password',
    ])->assertSessionHasErrors('username');

    $this->assertGuest();
});

test('must_change_password redirects to change password page', function () {
    User::factory()->mustChangePassword()->create([
        'username' => 'new_user',
        'password' => bcrypt('password'),
        'is_active' => true,
    ]);

    $this->post('/login', [
        'username' => 'new_user',
        'password' => 'password',
    ])->assertRedirect(route('password.change-required'));
});

test('invalid credentials return error', function () {
    User::factory()->create(['username' => 'validuser', 'password' => bcrypt('correct')]);

    $this->post('/login', [
        'username' => 'validuser',
        'password' => 'wrong',
    ])->assertSessionHasErrors('username');

    $this->assertGuest();
});

test('username is case insensitive', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'password' => bcrypt('password'),
        'is_active' => true,
        'must_change_password' => false,
    ]);

    $this->post('/login', [
        'username' => 'TESTUSER',
        'password' => 'password',
    ])->assertRedirect(route('inicio'));

    $this->assertAuthenticatedAs($user);
});

test('authenticated user can logout', function () {
    $user = User::factory()->create(['username' => 'logoutuser']);

    $this->actingAs($user)
        ->post('/logout')
        ->assertRedirect('/');

    $this->assertGuest();
});

test('guest visiting root is redirected to login', function () {
    $this->get('/')->assertRedirect(route('login'));
});

test('authenticated user visiting root is redirected to inicio', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/')->assertRedirect(route('inicio'));
});

test('authenticated user visiting login is redirected to inicio', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/login')->assertRedirect(route('inicio'));
});

test('authenticated user posting to login is redirected to inicio', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/login', ['username' => $user->username, 'password' => 'password'])
        ->assertRedirect(route('inicio'));
});
