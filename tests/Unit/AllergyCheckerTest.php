<?php

use App\Support\AllergyChecker;

$cases = json_decode(
    file_get_contents(__DIR__.'/../fixtures/allergy-cases.json'),
    true,
);

foreach ($cases as $case) {
    test($case['label'], function () use ($case): void {
        expect(AllergyChecker::conflict($case['allergies'], $case['medication']))
            ->toBe($case['expected']);
    });
}
