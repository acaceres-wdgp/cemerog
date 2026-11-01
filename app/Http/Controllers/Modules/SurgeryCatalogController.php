<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\OperatingRoom;
use App\Models\SurgeryProcedure;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/** Administración › Catálogo de cirugías: procedures with price and duration, and operating rooms */
class SurgeryCatalogController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin-cirugias/index', [
            'procedures' => SurgeryProcedure::orderBy('code')->get()
                ->map(fn (SurgeryProcedure $p): array => [
                    'id' => $p->id, 'code' => $p->code, 'name' => $p->name, 'price' => $p->price,
                    'duration_minutes' => $p->duration_minutes, 'is_active' => $p->is_active,
                ])->all(),
            'operating_rooms' => OperatingRoom::orderBy('position')->orderBy('id')->get()
                ->map(fn (OperatingRoom $r): array => ['id' => $r->id, 'name' => $r->name, 'is_active' => $r->is_active])->all(),
            'next_code' => sprintf('Q-%02d', SurgeryProcedure::pluck('code')
                ->map(fn (string $c): int => (int) preg_replace('/\D/', '', $c))
                ->max() + 1),
        ]);
    }

    public function storeProcedure(Request $request): RedirectResponse
    {
        $p = SurgeryProcedure::create([...$this->procedureData($request), 'is_active' => true]);
        Toast::success("{$p->code} · {$p->name} agregado. Ya se puede programar.");

        return back();
    }

    public function updateProcedure(Request $request, SurgeryProcedure $procedure): RedirectResponse
    {
        $procedure->update($this->procedureData($request, $procedure));
        Toast::success("{$procedure->code} actualizado.");

        return back();
    }

    public function storeRoom(Request $request): RedirectResponse
    {
        $name = $this->roomName($request);
        OperatingRoom::create(['name' => $name, 'is_active' => true, 'position' => (int) OperatingRoom::max('position') + 1]);
        Toast::success("{$name} agregado.");

        return back();
    }

    public function updateRoom(Request $request, OperatingRoom $room): RedirectResponse
    {
        $room->update(['name' => $this->roomName($request, $room), 'is_active' => $request->boolean('is_active', true)]);
        Toast::success("{$room->name} actualizado.");

        return back();
    }

    /** @return array<string, mixed> */
    private function procedureData(Request $request, ?SurgeryProcedure $procedure = null): array
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:20', Rule::unique('surgery_procedures', 'code')->ignore($procedure?->id)],
            'name' => ['required', 'string', 'max:150'],
            'price' => ['required', 'integer', 'min:0', 'max:100000000'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:720'],
            'is_active' => ['sometimes', 'boolean'],
        ], ['code.unique' => 'Ya existe un procedimiento con ese código.']);

        return [
            'code' => mb_strtoupper(trim($data['code'])),
            'name' => trim($data['name']),
            'price' => (int) $data['price'],
            'duration_minutes' => (int) $data['duration_minutes'],
            ...(array_key_exists('is_active', $data) ? ['is_active' => (bool) $data['is_active']] : []),
        ];
    }

    private function roomName(Request $request, ?OperatingRoom $room = null): string
    {
        return trim((string) $request->validate([
            'name' => ['required', 'string', 'max:40', Rule::unique('operating_rooms', 'name')->ignore($room?->id)],
        ], ['name.unique' => 'Ya existe un quirófano con ese nombre.'])['name']);
    }
}
