<?php

use App\Models\User;
use Illuminate\Support\Facades\Validator;

test('validation messages are in Spanish, with readable field names', function () {
    $v = Validator::make(
        ['presion_arterial' => '', 'first_names' => str_repeat('a', 101)],
        ['presion_arterial' => 'required', 'first_names' => 'max:100'],
    );

    expect($v->errors()->first('presion_arterial'))->toBe('El campo presión arterial es obligatorio.')
        ->and($v->errors()->first('first_names'))->toBe('El campo nombres no debe tener más de 100 caracteres.');
});

test('no validation message falls back to its translation key', function () {
    $en = require base_path('vendor/laravel/framework/src/Illuminate/Translation/lang/en/validation.php');

    foreach ($en as $rule => $message) {
        if (in_array($rule, ['custom', 'attributes'], true)) {
            continue;
        }
        foreach ((array) $message as $type => $_) {
            $key = is_array($message) ? "validation.{$rule}.{$type}" : "validation.{$rule}";
            expect(__($key))->not->toBe($key, "Falta la traducción de {$key}");
        }
    }
});

test('a vital sign out of range shows a Spanish message', function () {
    $v = Validator::make(['frecuencia_respiratoria' => 96], ['frecuencia_respiratoria' => 'integer|between:4,80']);

    expect($v->errors()->first('frecuencia_respiratoria'))->toBe('El campo frecuencia respiratoria debe estar entre 4 y 80.');
});

test('a failed login is explained in Spanish', function () {
    User::factory()->create(['username' => 'rosa']);

    $this->post('/login', ['username' => 'rosa', 'password' => 'incorrecta'])
        ->assertSessionHasErrors(['username' => 'Usuario o contraseña incorrectos.']);
});
