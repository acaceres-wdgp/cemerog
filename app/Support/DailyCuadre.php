<?php

namespace App\Support;

use App\Actions\Caja\CashShiftSummary;
use App\Models\CashShift;
use App\Models\CashWithdrawal;
use App\Models\Invoice;
use App\Models\Receipt;
use Carbon\CarbonInterface;

/**
 * Cuadre de caja of a day, for print: every shift opened that day (in the
 * clinic's time zone) with its money and count, the totals of the day by
 * payment method, its receipts and withdrawals, and what was billed.
 */
class DailyCuadre
{
    public function __construct(
        private CashShiftSummary $summary,
        private InvoicePresenter $invoices,
    ) {}

    /** @return array<string, mixed> */
    public function handle(CarbonInterface $day): array
    {
        $from = $day->copy()->setTimezone(ClinicTime::TIMEZONE)->startOfDay();
        $to = $from->copy()->endOfDay();
        // Dates are stored in the app time zone: compare in it, not in UTC
        $tz = (string) config('app.timezone');
        $range = [$from->copy()->setTimezone($tz), $to->copy()->setTimezone($tz)];

        $shifts = CashShift::with(['opener', 'closer', 'withdrawals.creator', 'receipts.payments', 'receipts.creator', 'receipts.invoice.patient'])
            ->whereBetween('opened_at', $range)
            ->orderBy('opened_at')
            ->get();

        $rows = $shifts->map(function (CashShift $shift): array {
            $summary = $this->summary->handle($shift);

            return [
                'id' => $shift->id,
                'label' => self::label($shift),
                'status' => $shift->status,
                'opened_by' => $shift->opener->name,
                'opened_at' => ClinicTime::time($shift->opened_at),
                'closed_by' => $shift->closer?->name,
                'closed_at' => ClinicTime::time($shift->closed_at),
                'summary' => $summary,
                'expected_cash' => $shift->expected_cash ?? $summary['expected_cash'],
                'counted_cash' => $shift->counted_cash,
                'difference' => $shift->difference,
                'close_note' => $shift->close_note,
            ];
        });

        $income = ['efectivo' => 0, 'tarjeta' => 0, 'transferencia' => 0];
        foreach ($rows as $row) {
            foreach ($income as $method => $amount) {
                $income[$method] = $amount + $row['summary']['income'][$method];
            }
        }
        $closed = $rows->where('status', 'cerrado');

        $billed = Invoice::whereBetween('issued_at', $range)->get();
        $live = $billed->where('status', '!=', 'anulada');
        $voided = $billed->where('status', 'anulada');

        return [
            'date' => $from->format('d/m/Y'),
            'label' => $from->locale('es')->isoFormat('dddd, D [de] MMMM [de] YYYY'),
            'shifts' => $rows->values()->all(),
            'open_shifts' => $rows->where('status', 'abierto')->count(),
            'totals' => [
                'opening' => (int) $rows->sum(fn ($r) => $r['summary']['opening']),
                'income' => $income,
                'collected' => array_sum($income),
                'withdrawals' => (int) $rows->sum(fn ($r) => $r['summary']['withdrawals']),
                'expected_cash' => (int) $rows->sum('expected_cash'),
                'counted_cash' => $closed->isEmpty() ? null : (int) $closed->sum('counted_cash'),
                'difference' => $closed->isEmpty() ? null : (int) $closed->sum('difference'),
            ],
            'receipts' => $shifts->flatMap(fn (CashShift $shift) => $shift->receipts->sortBy('id')->map(fn (Receipt $r): array => [
                ...$this->invoices->receiptRow($r),
                'shift' => self::label($shift),
                'time' => ClinicTime::time($r->created_at),
                'invoice_number' => $r->invoice->number,
                'patient' => $r->invoice->patient->full_name,
            ]))->values()->all(),
            'withdrawals' => $shifts->flatMap(fn (CashShift $shift) => $shift->withdrawals->map(fn (CashWithdrawal $w): array => [
                'id' => $w->id,
                'shift' => self::label($shift),
                'time' => ClinicTime::time($w->created_at),
                'amount' => $w->amount,
                'reason' => $w->reason,
                'created_by' => $w->creator->name,
            ]))->values()->all(),
            'billing' => [
                'count' => $live->count(),
                'total' => (int) $live->sum('total'),
                'on_credit' => (int) $live->whereNotNull('credit_due_date')->sum('total'),
                'discounts' => (int) $live->sum('discount_amount'),
                'voided_count' => $voided->count(),
                'voided_total' => (int) $voided->sum('total'),
            ],
        ];
    }

    /** «Mañana» or «Tarde», by the hour it was opened in the clinic */
    private static function label(CashShift $shift): string
    {
        return $shift->opened_at->copy()->setTimezone(ClinicTime::TIMEZONE)->hour < 12 ? 'Mañana' : 'Tarde';
    }
}
