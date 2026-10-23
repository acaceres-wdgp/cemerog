<?php

/**
 * CEMEROG has no public registration, password recovery, email
 * verification or 2FA: only the administrator manages accounts.
 */
test('fortify is not installed', function () {
    expect(class_exists(\Laravel\Fortify\Fortify::class))->toBeFalse();
});

test('public auth routes do not exist', function (string $method, string $url) {
    $this->{$method}($url)->assertNotFound();
})->with([
    'register page' => ['get', '/register'],
    'register' => ['post', '/register'],
    'forgot password page' => ['get', '/forgot-password'],
    'forgot password' => ['post', '/forgot-password'],
    'reset password page' => ['get', '/reset-password/token'],
    'reset password' => ['post', '/reset-password'],
    'email verification' => ['get', '/email/verify'],
    'two factor challenge' => ['get', '/two-factor-challenge'],
    'confirm password' => ['get', '/user/confirm-password'],
]);
