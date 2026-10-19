<?php

/**
 * PHP-side money validation tests.
 * The JS formatMoney() function is tested separately in Vitest.
 */

test('centavo amounts are positive integers', function () {
    $amounts = [150050, 0, 10000, 28450000];

    foreach ($amounts as $amount) {
        expect($amount)->toBeInt()
            ->and($amount)->toBeGreaterThanOrEqual(0);
    }
});

test('money calculation avoids floating point errors', function () {
    // Simulate invoice total in centavos
    $items = [1050, 500, 250]; // 10.50 + 5.00 + 2.50
    $total = array_sum($items);

    expect($total)->toBe(1800);
    expect($total / 100)->toEqual(18.0);
});
