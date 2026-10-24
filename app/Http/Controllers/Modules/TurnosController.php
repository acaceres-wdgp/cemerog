<?php

namespace App\Http\Controllers\Modules;

use App\Actions\AssignTurn;
use App\Actions\ReorderTurn;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTurnRequest;
use App\Http\Requests\UpdateTurnStatusRequest;
use App\Models\Turn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TurnosController extends Controller
{
    public function store(StoreTurnRequest $request, AssignTurn $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->route('tablero')
            ->with('flash', ['type' => 'success', 'message' => 'Turno asignado correctamente.']);
    }

    public function updateStatus(UpdateTurnStatusRequest $request, Turn $turn): RedirectResponse
    {
        $turn->update(['status' => $request->validated()['status']]);

        return redirect()->route('tablero')
            ->with('flash', ['type' => 'success', 'message' => 'Estado del turno actualizado.']);
    }

    public function reorder(Request $request, Turn $turn, ReorderTurn $action): RedirectResponse
    {
        abort_unless(auth()->user()?->can('module.tablero.access'), 403);

        $request->validate(['direction' => 'required|in:up,down']);

        $action->handle($turn, (string) $request->input('direction'));

        return redirect()->route('tablero');
    }
}
