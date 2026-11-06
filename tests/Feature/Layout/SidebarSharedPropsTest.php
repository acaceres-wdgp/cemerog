<?php

use App\Models\User;

/**
 * The sidebar state comes from cookies on the server, so the server-rendered
 * HTML matches what the browser renders (no hydration mismatch).
 */
function sidebarProps(array $cookies): array
{
    $user = User::factory()->create();
    $user->assignRole('administrador');

    $props = [];
    test()->actingAs($user)
        ->withUnencryptedCookies($cookies)
        ->get('/inicio')
        ->assertInertia(function ($page) use (&$props) {
            $props = [
                'open' => $page->toArray()['props']['sidebarOpen'],
                'theme' => $page->toArray()['props']['sidebarTheme'],
            ];
        });

    return $props;
}

test('defaults to an open sidebar with the carbon theme', function () {
    expect(sidebarProps([]))->toBe(['open' => true, 'theme' => 'carbon']);
});

test('reads the collapsed state and the theme from cookies', function () {
    expect(sidebarProps(['sidebar_state' => 'collapsed', 'sidebar_theme' => 'forest']))
        ->toBe(['open' => false, 'theme' => 'forest']);
});

test('falls back to carbon for an unknown theme', function () {
    expect(sidebarProps(['sidebar_theme' => 'neon'])['theme'])->toBe('carbon');
});
