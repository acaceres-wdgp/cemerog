<?php

use App\Rules\DocumentNumberFormat;
use App\Rules\DominicanPhone;
use App\Rules\Rnc;
use Illuminate\Support\Facades\Validator;

function failsWith(mixed $value, object $rule): ?string
{
    $validator = Validator::make(['field' => $value], ['field' => [$rule]]);

    return $validator->fails() ? $validator->errors()->first('field') : null;
}

it('accepts a complete Dominican phone, with or without the mask', function (string $phone) {
    expect(failsWith($phone, new DominicanPhone))->toBeNull();
})->with(['(809) 555-1234', '829-555-1234', '8495551234']);

it('rejects an incomplete phone or one outside Dominican area codes', function (string $phone) {
    expect(failsWith($phone, new DominicanPhone))
        ->toBe('El teléfono debe tener 10 dígitos y empezar por 809, 829 u 849.');
})->with(['809', '(809) 555-12', '(123) 555-1234', '1-809-555-1234']);

it('requires the 11 digits of a cédula', function () {
    expect(failsWith('001-1234567-8', new DocumentNumberFormat('cedula')))->toBeNull()
        ->and(failsWith('00112345678', new DocumentNumberFormat('cedula')))->toBeNull()
        ->and(failsWith('001', new DocumentNumberFormat('cedula')))
        ->toBe('La cédula debe tener 11 dígitos (000-0000000-0).')
        ->and(failsWith('001-1234567-89', new DocumentNumberFormat('cedula')))
        ->toBe('La cédula debe tener 11 dígitos (000-0000000-0).');
});

it('requires a plausible passport or foreign ID', function (string $type) {
    expect(failsWith('AB123456', new DocumentNumberFormat($type)))->toBeNull()
        ->and(failsWith('A12', new DocumentNumberFormat($type)))
        ->toBe('El documento debe tener entre 5 y 20 letras o números.');
})->with(['pasaporte', 'cedula_extranjera']);

it('does not check the number of a patient without a document', function () {
    expect(failsWith('GEN-123', new DocumentNumberFormat('no_tiene')))->toBeNull();
});

it('accepts an RNC of 9 digits or a cédula of 11', function () {
    expect(failsWith('1-01-12345-6', new Rnc))->toBeNull()
        ->and(failsWith('001-1234567-8', new Rnc))->toBeNull()
        ->and(failsWith('1234', new Rnc))
        ->toBe('El RNC debe tener 9 dígitos, u 11 si es una cédula.');
});
