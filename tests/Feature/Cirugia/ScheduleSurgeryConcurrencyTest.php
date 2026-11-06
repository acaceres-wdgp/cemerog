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
    $roomLock = strpos($body, '$this->lockRoom($roomId)');
    $clash = strpos($body, "Surgery::where('operating_room_id', \$roomId)");

    expect($roomLock)->not->toBeFalse()
        ->and($clash)->not->toBeFalse()
        ->and($roomLock)->toBeLessThan($clash);

    // The clash query, up to its first(), must include lockForUpdate()
    $clashQuery = substr($body, $clash, strpos($body, '->first()', $clash) - $clash);
    expect($clashQuery)->toContain('->lockForUpdate()');
});

/**
 * Same order everywhere: operating room, then surgeries. Locking the surgery
 * first made two reschedules in one room wait for each other (MySQL error 1213),
 * even with no conflict between them. Verified with concurrent requests on MySQL.
 */
test('rescheduling locks the operating room before the surgery', function () {
    $source = file_get_contents(app_path('Actions/Cirugia/ScheduleSurgery.php'));

    preg_match('/function reschedule.*?\n    }\n/s', $source, $method);
    expect($method)->not->toBeEmpty();

    $body = $method[0];
    $roomLock = strpos($body, 'lockRoom(');
    $surgeryLock = strpos($body, 'Surgery::whereKey($surgery->id)->lockForUpdate()');

    expect($roomLock)->not->toBeFalse()
        ->and($surgeryLock)->not->toBeFalse()
        ->and($roomLock)->toBeLessThan($surgeryLock);
});

test('scheduling and rescheduling retry when MySQL reports a deadlock', function () {
    $source = file_get_contents(app_path('Actions/Cirugia/ScheduleSurgery.php'));

    expect(substr_count($source, '}, self::DEADLOCK_ATTEMPTS);'))->toBe(2);
});
