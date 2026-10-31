<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Caja\CashShiftSummary;
use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\CashWithdrawal;
use App\Models\Receipt;
use App\Models\User;
use App\Support\CashDenominations;
use App\Support\InvoicePresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CuadreController extends Controller
{
    public function index(Request $request, CashShiftSummary $summary, InvoicePresenter $presenter): Response
    {
        /** @var User $user */
        $user = $request->user();

        $shift = CashShift::with(['opener', 'withdrawals.creator', 'receipts.payments', 'receipts.creator', 'receipts.invoice.patient'])->open()->first();

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
                'receipts' => $shift->receipts->sortByDesc('id')->map(fn (Receipt $r): array => [
                    ...$presenter->receiptRow($r),
                    'invoice_number' => $r->invoice->number,
                    'patient' => $r->invoice->patient->full_name,
                ])->values()->all(),
            ] : null,
            'history' => $history,
            'denominations' => CashDenominations::VALUES,
        ]);
    }

    /** Printable report of a shift: float, receipts, withdrawals and the count */
    public function report(CashShift $shift, CashShiftSummary $summary, InvoicePresenter $presenter): Response
    {
        $shift->load(['opener', 'closer', 'withdrawals.creator', 'receipts.payments', 'receipts.creator', 'receipts.invoice.patient']);

        return Inertia::render('cuadre/reporte', [
            'shift' => [
                'id' => $shift->id,
                'status' => $shift->status,
                'opened_by' => $shift->opener->name,
                'opened_at' => $shift->opened_at->format('d/m/Y H:i'),
                'closed_by' => $shift->closer?->name,
                'closed_at' => $shift->closed_at?->format('d/m/Y H:i'),
                'summary' => $summary->handle($shift),
                'expected_cash' => $shift->expected_cash,
                'counted_cash' => $shift->counted_cash,
                'difference' => $shift->difference,
                'close_note' => $shift->close_note,
                'withdrawals' => $shift->withdrawals->map(fn (CashWithdrawal $w): array => [
                    'id' => $w->id,
                    'amount' => $w->amount,
                    'reason' => $w->reason,
                    'created_by' => $w->creator->name,
                    'time' => $w->created_at?->format('H:i'),
                ])->all(),
                'receipts' => $shift->receipts->sortBy('id')->map(fn (Receipt $r): array => [
                    ...$presenter->receiptRow($r),
                    'invoice_number' => $r->invoice->number,
                    'patient' => $r->invoice->patient->full_name,
                ])->values()->all(),
            ],
            'clinic' => ['name' => config('cemerog.clinic.name')],
        ]);
    }
}
