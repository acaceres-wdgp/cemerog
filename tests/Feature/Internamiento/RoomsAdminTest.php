<?php

use App\Models\Bed;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use Database\Seeders\RoomSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->seed(RoomSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('administrador');
    $this->semi = RoomType::where('name', 'Semiprivada')->first();
});

test('the seed loads the types and the six rooms of the design with their beds', function () {
    expect(RoomType::pluck('daily_price', 'name')->all())->toBe(['Privada' => 350000, 'Semiprivada' => 250000, 'Suite' => 500000])
        ->and(Room::count())->toBe(6)
        ->and(Room::where('name', 'Hab. 2')->first()->beds->pluck('name')->all())->toBe(['Cama A', 'Cama B'])
        ->and(Room::where('name', 'Hab. 1')->first()->beds->pluck('name')->all())->toBe(['Cama única'])
        ->and(Bed::where('status', 'libre')->count())->toBe(9);

    $this->actingAs($this->admin)
        ->get('/admin/habitaciones')
        ->assertInertia(fn ($page) => $page
            ->component('habs/index')
            ->has('types', 3)
            ->has('rooms', 6)
            ->where('rooms.1.name', 'Hab. 2')
            ->where('rooms.1.daily_price', 250000)
            ->has('rooms.1.beds', 2)
        );
});

test('room types are created, repriced and deleted only when unused', function () {
    $this->actingAs($this->admin)->post('/admin/habitaciones/tipos', ['name' => 'Intensivo', 'daily_price' => 800000])->assertSessionHasNoErrors();
    $intensivo = RoomType::where('name', 'Intensivo')->first();

    $this->actingAs($this->admin)->put("/admin/habitaciones/tipos/{$this->semi->id}", ['name' => 'Semiprivada', 'daily_price' => 275000]);
    expect($this->semi->fresh()->daily_price)->toBe(275000);

    $this->actingAs($this->admin)->delete("/admin/habitaciones/tipos/{$this->semi->id}")->assertSessionHasErrors('type');
    $this->actingAs($this->admin)->delete("/admin/habitaciones/tipos/{$intensivo->id}")->assertSessionHasNoErrors();
    expect(RoomType::where('name', 'Intensivo')->exists())->toBeFalse();
});

test('a room is created with its beds, retyped, and beds are added or removed', function () {
    $this->actingAs($this->admin)
        ->post('/admin/habitaciones', ['name' => 'Hab. 7', 'room_type_id' => $this->semi->id, 'beds' => 2])
        ->assertSessionHasNoErrors();
    $room = Room::where('name', 'Hab. 7')->first();
    expect($room->beds->pluck('name')->all())->toBe(['Cama A', 'Cama B']);

    $this->actingAs($this->admin)->post("/admin/habitaciones/{$room->id}/camas");
    expect($room->fresh()->beds->pluck('name')->all())->toBe(['Cama A', 'Cama B', 'Cama C']);

    $this->actingAs($this->admin)->delete('/admin/habitaciones/camas/'.$room->beds()->first()->id);
    $this->actingAs($this->admin)->delete('/admin/habitaciones/camas/'.$room->beds()->first()->id);
    expect($room->fresh()->beds->pluck('name')->all())->toBe(['Cama única']);

    // The last bed stays
    $this->actingAs($this->admin)->delete('/admin/habitaciones/camas/'.$room->beds()->first()->id)->assertSessionHasErrors('bed');

    $privada = RoomType::where('name', 'Privada')->first();
    $this->actingAs($this->admin)->put("/admin/habitaciones/{$room->id}", ['name' => 'Hab. 7', 'room_type_id' => $privada->id]);
    expect($room->fresh()->room_type_id)->toBe($privada->id);

    $this->actingAs($this->admin)->post('/admin/habitaciones', ['name' => 'Hab. 7', 'room_type_id' => $privada->id, 'beds' => 1])->assertSessionHasErrors('name');
});

test('an occupied bed cannot be removed', function () {
    $bed = Room::where('name', 'Hab. 2')->first()->beds()->first();
    $bed->update(['status' => 'ocupada']);

    $this->actingAs($this->admin)->delete("/admin/habitaciones/camas/{$bed->id}")->assertSessionHasErrors('bed');
});

test('only the administrator manages rooms', function () {
    $enfermera = User::factory()->create();
    $enfermera->assignRole('enfermeria');

    $this->actingAs($enfermera)->get('/admin/habitaciones')->assertForbidden();
});

test('the rooms and admissions migrations can be rolled back', function () {
    $admissions = 'database/migrations/2026_11_08_200000_create_admissions_tables.php';
    $rooms = 'database/migrations/2026_11_08_100000_create_rooms_and_beds_tables.php';

    $this->artisan('migrate:rollback', ['--path' => $admissions])->assertSuccessful();
    expect(Schema::hasTable('admissions'))->toBeFalse()
        ->and(Schema::hasColumn('emergency_vitals', 'admission_id'))->toBeFalse();
    $this->artisan('migrate:rollback', ['--path' => $rooms])->assertSuccessful();
    expect(Schema::hasTable('beds'))->toBeFalse();

    $this->artisan('migrate', ['--path' => $rooms, '--force' => true])->assertSuccessful();
    $this->artisan('migrate', ['--path' => $admissions, '--force' => true])->assertSuccessful();
    expect(Schema::hasTable('admission_stays'))->toBeTrue();
});
