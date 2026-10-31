<?php

namespace App\Support;

use App\Actions\Caja\CashShiftSummary;
use App\Models\CashShift;
use App\Models\CashWithdrawal;
use App\Models\Payment;
use App\Models\Receipt;
use App\Models\User;

/** Shapes a cash shift for the Cuadre de caja page */
class CashShiftPresenter
{
    public const RELATIONS = ['opener', 'closer', 'withdrawals.creator', 'receipts.payments', 'receipts.invoice.patient'];

    public function __construct(
        private readonly CashShiftSummary $summary,
    ) {}

    /** @return array<string, mixed> */
    public function shift(CashShift $shift, User $user): array
    {
        $shift->loadMissing(self::RELATIONS);
        $open = $shift->isOpen();

        return [
            'id' => $shift->id,
            'status' => $shift->status,
            'opened_by' => $shift->opener->name,
            'opened_at' => $shift->opened_at->format('d/m/Y H:i'),
            'closed_by' => $shift->closer?->name,
            'closed_at' => $shift->closed_at?->format('d/m/Y H:i'),
            'pending_close' => $open && $shift->isPendingClose(),
            'can_operate' => $open && ($shift->opened_by === $user->id || $user->hasRole('administrador')),
            'summary' => $this->summary->handle($shift),
            'counted' => $open ? null : [
                'cash' => $shift->counted_cash,
                'card' => $shift->counted_card,
                'transfer' => $shift->counted_transfer,
                'denominations' => $shift->counted_denominations,
            ],
            'difference' => $shift->difference,
            'close_note' => $shift->close_note,
            'movements' => $this->movements($shift),
            'withdrawals' => $shift->withdrawals->map(fn (CashWithdrawal $w): array => [
                'id' => $w->id,
                'amount' => $w->amount,
                'reason' => $w->reason,
                'created_by' => $w->creator->name,
                'time' => $w->created_at?->format('H:i'),
            ])->all(),
        ];
    }

    /**
     * Shifts for the picker: the open one first, then the latest closed.
     *
     * @return list<array{id: int, label: string, status: string}>
     */
    public function picker(int $closedLimit = 6): array
    {
        $open = CashShift::open()->get();
        $closed = CashShift::where('status', 'cerrado')->orderByDesc('closed_at')->limit($closedLimit)->get();

        return $open->concat($closed)->map(fn (CashShift $s): array => [
            'id' => $s->id,
            'label' => $this->label($s),
            'status' => $s->status,
        ])->values()->all();
    }

    /** «Hoy · Mañana», «30/10 · Tarde» */
    private function label(CashShift $shift): string
    {
        $day = $shift->opened_at->isToday() ? 'Hoy' : $shift->opened_at->format('d/m');

        return $day.' · '.($shift->opened_at->hour < 12 ? 'Mañana' : 'Tarde');
    }

    /**
     * One row per payment of the shift, in the order they were taken.
     *
     * @return list<array<string, mixed>>
     */
    private function movements(CashShift $shift): array
    {
        return $shift->receipts->sortBy('id')->flatMap(
            fn (Receipt $r) => $r->payments->map(fn (Payment $p): array => [
                'id' => $p->id,
                'receipt_id' => $r->id,
                'time' => $r->created_at?->format('H:i'),
                'receipt' => $r->number,
                'patient' => $r->invoice->patient->full_name,
                'concept' => 'Pago de '.$r->invoice->number,
                'method' => $p->method,
                'amount' => $p->amount,
                'voided' => $r->voided_at !== null,
            ]),
        )->values()->all();
    }
}
