<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Caja\CashShiftSummary;
use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\CashWithdrawal;
use App\Models\User;
use App\Support\CashDenominations;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CuadreController extends Controller
{
    public function index(Request $request, CashShiftSummary $summary): Response
    {
        /** @var User $user */
        $user = $request->user();

        $shift = CashShift::with(['opener', 'withdrawals.creator'])->open()->first();

        $history = CashShift::with(['opener', 'closer'])
            ->where('status', 'cerrado')
            ->orderByDesc('closed_at')
            ->limit(10)
            ->get()
            ->map(fn (CashShift $s): array => [
                'id' => $s->id,
                'opened_by' => $s->opener->name,
                'opened_at' => $s->opened_at->format('d/m/Y H:i'),
                'closed_by' => $s->closer?->name,
                'closed_at' => $s->closed_at?->format('d/m/Y H:i'),
                'expected_cash' => $s->expected_cash,
                'counted_cash' => $s->counted_cash,
                'difference' => $s->difference,
                'close_note' => $s->close_note,
            ])
            ->all();

        return Inertia::render('cuadre/index', [
            'shift' => $shift ? [
                'id' => $shift->id,
                'opened_by' => $shift->opener->name,
                'opened_at' => $shift->opened_at->format('d/m/Y H:i'),
                'pending_close' => $shift->isPendingClose(),
                'can_operate' => $shift->opened_by === $user->id || $user->hasRole('administrador'),
                'summary' => $summary->handle($shift),
                'withdrawals' => $shift->withdrawals->map(fn (CashWithdrawal $w): array => [
                    'id' => $w->id,
                    'amount' => $w->amount,
                    'reason' => $w->reason,
                    'created_by' => $w->creator->name,
                    'time' => $w->created_at?->format('H:i'),
                ])->all(),
            ] : null,
            'history' => $history,
            'denominations' => CashDenominations::VALUES,
        ]);
    }
}
