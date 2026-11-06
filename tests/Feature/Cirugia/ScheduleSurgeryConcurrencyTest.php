<?php

/**
 * Two users scheduling at the same time must not overlap surgeries.
 *
 * MySQL runs at REPEATABLE READ: a plain SELECT reads the snapshot taken at the
 * transaction's first read, which can predate another user's commit even after
 * waiting on the operating-room lock. The clash lookup must therefore be a
 * locking read, which always sees the latest committed rows. SQLite (tests)
 * cannot reproduce this, so this guards the code; the race itself was verified
 * with two concurrent processes against MySQL.
 */
test('the clash lookup is a locking read, after locking the operating room', function () {
    $source = file_get_contents(app_path('Actions/Cirugia/ScheduleSurgery.php'));

    preg_match('/function ensureFree.*?\n    }\n/s', $source, $method);
    expect($method)->not->toBeEmpty();

    $body = $method[0];
    $roomLock = strpos($body, 'OperatingRoom::whereKey($roomId)->lockForUpdate()');
    $clash = strpos($body, "Surgery::where('operating_room_id', \$roomId)");

    expect($roomLock)->not->toBeFalse()
        ->and($clash)->not->toBeFalse()
        ->and($roomLock)->toBeLessThan($clash);

    // The clash query, up to its first(), must include lockForUpdate()
    $clashQuery = substr($body, $clash, strpos($body, '->first()', $clash) - $clash);
    expect($clashQuery)->toContain('->lockForUpdate()');
});
