<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Caja\CloseCashShift;
use App\Actions\Caja\OpenCashShift;
use App\Actions\Caja\RecordCashWithdrawal;
use App\Http\Controllers\Controller;
use App\Http\Requests\CashWithdrawalRequest;
use App\Http\Requests\CloseCashShiftRequest;
use App\Http\Requests\OpenCashShiftRequest;
use App\Models\CashShift;
use App\Models\User;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class CashShiftController extends Controller
{
    public function open(OpenCashShiftRequest $request, OpenCashShift $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $action->handle($user, (int) ($data['opening_amount'] ?? 0), $data['denominations'] ?? null);

        Toast::success('Turno de caja abierto.');

        return back();
    }

    public function withdraw(CashWithdrawalRequest $request, RecordCashWithdrawal $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $shift = $this->shiftOperableBy($user);

        $action->handle($shift, $user, (int) $request->validated('amount'), (string) $request->validated('reason'));

        Toast::success('Retiro registrado.');

        return back();
    }

    public function close(CloseCashShiftRequest $request, CloseCashShift $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $shift = $this->shiftOperableBy($user);
        $data = $request->validated();

        $action->handle(
            $shift,
            $user,
            (int) ($data['counted_cash'] ?? 0),
            $data['denominations'] ?? null,
            $data['close_note'] ?? null,
            isset($data['counted_card']) ? (int) $data['counted_card'] : null,
            isset($data['counted_transfer']) ? (int) $data['counted_transfer'] : null,
        );

        Toast::success('Caja cuadrada. Turno cerrado.');

        return redirect()->route('cuadre');
    }

    /**
     * The open shift, if this user may work on it: the cashier who opened it,
     * or an administrator (e.g. to close a shift left open).
     */
    private function shiftOperableBy(User $user): CashShift
    {
        $shift = CashShift::current();

        if ($shift === null) {
            throw ValidationException::withMessages(['shift' => 'No hay un turno de caja abierto.']);
        }

        abort_unless($shift->opened_by === $user->id || $user->hasRole('administrador'), 403);

        return $shift;
    }
}
