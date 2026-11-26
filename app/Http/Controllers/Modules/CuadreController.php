<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Caja\CashShiftSummary;
use App\Http\Controllers\Controller;
use App\Models\CashShift;
use App\Models\CashWithdrawal;
use App\Models\Receipt;
use App\Models\User;
use App\Support\CashDenominations;
use App\Support\CashShiftPresenter;
use App\Support\Clinic;
use App\Support\ClinicTime;
use App\Support\DailyCuadre;
use App\Support\InvoicePresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CuadreController extends Controller
{
    /**
     * Cuadre of the open shift, or of a closed one picked with ?turno=id.
     */
    public function index(Request $request, CashShiftPresenter $presenter): Response
    {
        /** @var User $user */
        $user = $request->user();

        $shift = $request->filled('turno')
            ? CashShift::find($request->integer('turno'))
            : CashShift::open()->first();

        return Inertia::render('cuadre/index', [
            'shift' => $shift ? $presenter->shift($shift, $user) : null,
            'shifts' => $presenter->picker(),
            'denominations' => CashDenominations::VALUES,
        ]);
    }

    /** Printable cuadre of a day (?fecha=AAAA-MM-DD, today by default): every shift of it */
    public function day(Request $request, DailyCuadre $cuadre): Response
    {
        $date = (string) $request->query('fecha', '');
        $day = preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) && checkdate((int) substr($date, 5, 2), (int) substr($date, 8, 2), (int) substr($date, 0, 4))
            ? Carbon::parse($date, ClinicTime::TIMEZONE)
            : Carbon::now(ClinicTime::TIMEZONE);

        return Inertia::render('cuadre/reporte-dia', [
            'day' => $cuadre->handle($day),
            'clinic' => Clinic::info(),
            'printed_by' => $request->user()?->name,
            'printed_at' => ClinicTime::dateTime(now()),
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
                'opened_at' => ClinicTime::dateTime($shift->opened_at),
                'closed_by' => $shift->closer?->name,
                'closed_at' => ClinicTime::dateTime($shift->closed_at),
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
                    'time' => ClinicTime::time($w->created_at),
                ])->all(),
                'receipts' => $shift->receipts->sortBy('id')->map(fn (Receipt $r): array => [
                    ...$presenter->receiptRow($r),
                    'invoice_number' => $r->invoice->number,
                    'patient' => $r->invoice->patient->full_name,
                ])->values()->all(),
            ],
            'clinic' => Clinic::info(),
        ]);
    }
}
