<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Room;
use App\Models\RoomType;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Administración › Habitaciones y camas: room types with price per day, rooms and beds */
class HabsController extends Controller
{
    public function index(): Response
    {
        $rooms = Room::with(['type', 'beds.admission.patient'])->orderBy('position')->orderBy('id')->get();

        return Inertia::render('habs/index', [
            'types' => RoomType::withCount('rooms')->orderBy('daily_price')->get()
                ->map(fn (RoomType $t): array => ['id' => $t->id, 'name' => $t->name, 'daily_price' => $t->daily_price, 'rooms' => $t->rooms_count])->all(),
            'rooms' => $rooms->map(fn (Room $r): array => [
                'id' => $r->id,
                'name' => $r->name,
                'type_id' => $r->room_type_id,
                'type' => $r->type->name,
                'daily_price' => $r->type->daily_price,
                'beds' => $r->beds->map(fn (Bed $b): array => [
                    'id' => $b->id,
                    'name' => $b->name,
                    'status' => $b->status,
                    'patient' => $b->admission?->patient->full_name,
                ])->all(),
            ])->all(),
        ]);
    }

    public function storeType(Request $request): RedirectResponse
    {
        $type = RoomType::create($this->typeData($request));
        Toast::success("Tipo «{$type->name}» agregado.");

        return back();
    }

    public function updateType(Request $request, RoomType $type): RedirectResponse
    {
        $type->update($this->typeData($request, $type));
        Toast::success("Tipo «{$type->name}» actualizado. El precio nuevo aplica a los ingresos y cambios desde ahora.");

        return back();
    }

    public function destroyType(RoomType $type): RedirectResponse
    {
        if ($type->rooms()->exists()) {
            throw ValidationException::withMessages(['type' => "«{$type->name}» tiene habitaciones. Cámbialas de tipo antes de eliminarlo."]);
        }
        $type->delete();
        Toast::success("Tipo «{$type->name}» eliminado.");

        return back();
    }

    public function storeRoom(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40', 'unique:rooms,name'],
            'room_type_id' => ['required', 'integer', 'exists:room_types,id'],
            'beds' => ['required', 'integer', 'min:1', 'max:6'],
        ], ['name.unique' => 'Ya existe una habitación con ese nombre.']);

        $room = DB::transaction(function () use ($data): Room {
            $room = Room::create([
                'name' => trim($data['name']),
                'room_type_id' => $data['room_type_id'],
                'position' => (int) Room::max('position') + 1,
            ]);
            for ($i = 0; $i < $data['beds']; $i++) {
                $room->beds()->create(['name' => "tmp-{$i}", 'status' => 'libre']);
            }
            $room->renameBeds();

            return $room;
        });

        Toast::success("{$room->name} creada con {$data['beds']} ".($data['beds'] === 1 ? 'cama.' : 'camas.'));

        return back();
    }

    public function updateRoom(Request $request, Room $room): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40', Rule::unique('rooms', 'name')->ignore($room->id)],
            'room_type_id' => ['required', 'integer', 'exists:room_types,id'],
        ]);
        $room->update(['name' => trim($data['name']), 'room_type_id' => $data['room_type_id']]);

        Toast::success("{$room->name} actualizada.");

        return back();
    }

    public function addBed(Room $room): RedirectResponse
    {
        DB::transaction(function () use ($room): void {
            $room->beds()->create(['name' => 'tmp-new', 'status' => 'libre']);
            $room->renameBeds();
        });
        Toast::success("Cama agregada a {$room->name}.");

        return back();
    }

    /** Only a bed without a patient, and the room keeps at least one */
    public function removeBed(Bed $bed): RedirectResponse
    {
        $room = $bed->room;
        if ($bed->status === 'ocupada') {
            throw ValidationException::withMessages(['bed' => 'La cama tiene un paciente.']);
        }
        if ($room->beds()->count() === 1) {
            throw ValidationException::withMessages(['bed' => 'La habitación debe tener al menos una cama.']);
        }
        if ($bed->stays()->exists()) {
            throw ValidationException::withMessages(['bed' => 'La cama tiene historial de estancias y no se puede quitar.']);
        }
        DB::transaction(function () use ($bed, $room): void {
            $bed->delete();
            $room->renameBeds();
        });
        Toast::success("Cama quitada de {$room->name}.");

        return back();
    }

    /** @return array{name: string, daily_price: int} */
    private function typeData(Request $request, ?RoomType $type = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40', Rule::unique('room_types', 'name')->ignore($type?->id)],
            'daily_price' => ['required', 'integer', 'min:0', 'max:100000000'],
        ], ['name.unique' => 'Ya existe un tipo con ese nombre.']);

        return ['name' => trim($data['name']), 'daily_price' => (int) $data['daily_price']];
    }
}
