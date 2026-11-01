<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Database\Seeder;

/** Room types and the rooms of the design (Hab. 1 to 6), to test Internamiento */
class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $types = [];
        foreach ([['Privada', 350000], ['Semiprivada', 250000], ['Suite', 500000]] as [$name, $price]) {
            $types[$name] = RoomType::firstOrCreate(['name' => $name], ['daily_price' => $price]);
        }

        $rooms = [['Hab. 1', 'Privada', 1], ['Hab. 2', 'Semiprivada', 2], ['Hab. 3', 'Semiprivada', 2],
            ['Hab. 4', 'Semiprivada', 2], ['Hab. 5', 'Privada', 1], ['Hab. 6', 'Privada', 1]];
        foreach ($rooms as $i => [$name, $type, $beds]) {
            if (Room::where('name', $name)->exists()) {
                continue;
            }
            $room = Room::create(['name' => $name, 'room_type_id' => $types[$type]->id, 'position' => $i + 1]);
            for ($b = 0; $b < $beds; $b++) {
                $room->beds()->create(['name' => "tmp-{$b}", 'status' => 'libre']);
            }
            $room->renameBeds();
        }

        $this->command->info('Habitaciones: '.count($rooms).' con sus camas.');
    }
}
