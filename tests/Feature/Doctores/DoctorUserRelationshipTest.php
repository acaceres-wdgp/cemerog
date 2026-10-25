<?php

use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

// ─── Doctor → User (BelongsTo) ────────────────────────────────────────────────

test('doctor has a belongsTo relationship to user', function () {
    $doctor = new Doctor;

    expect($doctor->user())->toBeInstanceOf(BelongsTo::class);
});

test('doctor can be linked to a user', function () {
    $specialty = Specialty::factory()->create();
    $user = User::factory()->create();

    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    expect($doctor->fresh()->user)->not->toBeNull();
    expect($doctor->fresh()->user->id)->toBe($user->id);
});

test('doctor can exist without a user (nullable)', function () {
    $specialty = Specialty::factory()->create();

    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => null,
    ]);

    expect($doctor->fresh()->user)->toBeNull();
});

// ─── User → Doctor (HasOne) ───────────────────────────────────────────────────

test('user has a hasOne relationship to doctor', function () {
    $user = new User;

    expect($user->doctor())->toBeInstanceOf(HasOne::class);
});

test('user can retrieve its linked doctor', function () {
    $specialty = Specialty::factory()->create();
    $user = User::factory()->create();

    $doctor = Doctor::factory()->create([
        'specialty_id' => $specialty->id,
        'user_id' => $user->id,
    ]);

    expect($user->fresh()->doctor)->not->toBeNull();
    expect($user->fresh()->doctor->id)->toBe($doctor->id);
});

test('user with no linked doctor returns null', function () {
    $user = User::factory()->create();

    expect($user->fresh()->doctor)->toBeNull();
});
