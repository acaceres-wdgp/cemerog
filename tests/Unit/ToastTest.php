<?php

use App\Support\Toast;

// T1 – success flash
test('Toast::success flashes inertia toast with type success', function () {
    Toast::success('Operación completada.');
    expect(session('inertia.flash_data.toast.type'))->toBe('success');
    expect(session('inertia.flash_data.toast.message'))->toBe('Operación completada.');
});

// T2 – error flash
test('Toast::error flashes inertia toast with type error', function () {
    Toast::error('Algo salió mal.');
    expect(session('inertia.flash_data.toast.type'))->toBe('error');
    expect(session('inertia.flash_data.toast.message'))->toBe('Algo salió mal.');
});
