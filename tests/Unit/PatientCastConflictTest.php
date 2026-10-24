<?php

use App\Models\Patient;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * Verifica que Patient no combine el cast 'encrypted' con un Attribute
 * sobre la misma columna — eso produce doble cifrado o fallo al descifrar.
 *
 * Regla (CLAUDE.md PII): para phone y document_number usar Attribute;
 * para email usar el cast 'encrypted'. Nunca los dos sobre la misma columna.
 */
test('Patient no combina cast encrypted con Attribute en phone', function () {
    $model = new Patient;
    $casts = $model->getCasts();

    // phone usa Attribute: debe estar AUSENTE de los casts como 'encrypted'
    $phoneCast = $casts['phone'] ?? null;
    expect($phoneCast)->not->toBe('encrypted',
        'phone tiene Attribute mutador; añadir cast encrypted produce doble cifrado',
    );

    // El Attribute phone() debe existir en el modelo
    $ref = new ReflectionClass(Patient::class);
    expect($ref->hasMethod('phone'))->toBeTrue();
    $method = $ref->getMethod('phone');
    expect($method->invoke($model))->toBeInstanceOf(Attribute::class);
});

test('Patient no combina cast encrypted con Attribute en document_number', function () {
    $model = new Patient;
    $casts = $model->getCasts();

    // document_number usa Attribute: debe estar AUSENTE de los casts como 'encrypted'
    $docCast = $casts['document_number'] ?? null;
    expect($docCast)->not->toBe('encrypted',
        'document_number tiene Attribute mutador; añadir cast encrypted produce doble cifrado',
    );

    // El Attribute documentNumber() debe existir
    $ref = new ReflectionClass(Patient::class);
    expect($ref->hasMethod('documentNumber'))->toBeTrue();
    $method = $ref->getMethod('documentNumber');
    expect($method->invoke($model))->toBeInstanceOf(Attribute::class);
});

test('Patient usa cast encrypted para email y NO tiene Attribute email()', function () {
    $model = new Patient;
    $casts = $model->getCasts();

    // email usa cast: debe estar presente como 'encrypted'
    expect($casts['email'] ?? null)->toBe('encrypted');

    // No debe haber un Attribute email() que entre en conflicto con el cast
    $ref = new ReflectionClass(Patient::class);
    $hasEmailAttribute = $ref->hasMethod('email')
        && $ref->getMethod('email')->getReturnType()?->getName() === Attribute::class;

    expect($hasEmailAttribute)->toBeFalse(
        'email tiene cast encrypted; un Attribute email() generaría doble cifrado',
    );
});
