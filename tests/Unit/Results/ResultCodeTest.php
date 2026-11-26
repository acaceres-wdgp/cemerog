<?php

use App\Actions\Results\ResultCode;

test('a code has 8 characters of the alphabet without look-alikes', function () {
    foreach (range(1, 200) as $_) {
        $code = ResultCode::random();
        expect($code)->toMatch('/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/');
    }
    expect(ResultCode::ALPHABET)->not->toContain('0')
        ->not->toContain('O')
        ->not->toContain('1')
        ->not->toContain('I')
        ->not->toContain('L');
});

test('a code prints as CMG-XXXX-XXXX', function () {
    expect(ResultCode::format('7K4P29XQ'))->toBe('CMG-7K4P-29XQ');
});

test('what the patient types is normalized: case, dashes, spaces and the optional prefix', function () {
    expect(ResultCode::normalize('CMG-7K4P-29XQ'))->toBe('7K4P29XQ')
        ->and(ResultCode::normalize('cmg 7k4p 29xq'))->toBe('7K4P29XQ')
        ->and(ResultCode::normalize('7k4p-29xq'))->toBe('7K4P29XQ')
        ->and(ResultCode::normalize('CMG7K4P29XQ'))->toBe('7K4P29XQ')
        // A code that itself starts with CMG keeps it
        ->and(ResultCode::normalize('CMGA2345'))->toBe('CMGA2345')
        ->and(ResultCode::normalize('CMG-7K4P-29X'))->toBeNull()
        ->and(ResultCode::normalize(''))->toBeNull()
        ->and(ResultCode::normalize(null))->toBeNull();
});
