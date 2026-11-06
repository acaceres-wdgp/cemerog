<?php

use App\Support\Clinic;

/**
 * Every printable document shows the same clinic header, from one place.
 */
test('returns the clinic data from the configuration', function () {
    config([
        'cemerog.clinic' => [
            'name' => 'Clínica Dres. Rodríguez & Guzmán',
            'rnc' => '1-01-00000-1',
            'phone' => '(809) 555-0100',
            'address' => 'Calle de Prueba #123',
        ],
    ]);

    expect(Clinic::info())->toBe([
        'name' => 'Clínica Dres. Rodríguez & Guzmán',
        'rnc' => '1-01-00000-1',
        'phone' => '(809) 555-0100',
        'address' => 'Calle de Prueba #123',
    ]);
});

test('keeps every key even when the optional data is missing', function () {
    config(['cemerog.clinic' => ['name' => 'CEMEROG', 'rnc' => null, 'phone' => null, 'address' => null]]);

    expect(Clinic::info())->toBe(['name' => 'CEMEROG', 'rnc' => null, 'phone' => null, 'address' => null]);
});
