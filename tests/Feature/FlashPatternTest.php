<?php

// FP1 – no controller uses ->with('flash'|'success') for user messages
test('no controller uses deprecated ->with flash pattern', function () {
    $files = glob(base_path('app/Http/Controllers/**/*.php'));
    $files = array_merge($files, glob(base_path('app/Http/Controllers/*.php')));

    $violations = [];

    foreach ($files as $file) {
        $contents = file_get_contents($file);
        $lines = explode("\n", $contents);

        foreach ($lines as $lineNumber => $line) {
            if (preg_match("/->with\('(flash|success|error|warning|info)'/", $line)) {
                $violations[] = basename($file).':'.($lineNumber + 1).' → '.trim($line);
            }
        }
    }

    expect($violations)->toBeEmpty(
        "Deprecated ->with() flash pattern found:\n".implode("\n", $violations)
    );
});
