<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Patients\SearchPatients;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\User;
use App\Support\ClinicTime;
use App\Support\InvoiceArea;
use App\Support\InvoicePresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Caja › Facturas: every issued invoice, filtered by period, state, area,
 * condition, cashier and a search, with the KPIs of what is filtered.
 * Filters and pages run on the server; there can be thousands of invoices.
 */
class FacturasController extends Controller
{
    private const PER_PAGE = 15;

    private const PERIODS = ['hoy', 'semana', 'mes', 'todo'];

    private const STATES = ['pendiente', 'pagada', 'anulada'];

    public function index(Request $request, InvoicePresenter $presenter, SearchPatients $searchPatients): Response
    {
        $filters = [
            'periodo' => in_array($request->query('periodo'), self::PERIODS, true) ? $request->query('periodo') : 'mes',
            'estado' => in_array($request->query('estado'), self::STATES, true) ? $request->query('estado') : 'todas',
            'area' => in_array($request->query('area'), InvoiceArea::all(), true) ? $request->query('area') : '',
            'condicion' => in_array($request->query('condicion'), ['contado', 'credito'], true) ? $request->query('condicion') : '',
            'cajero' => $request->integer('cajero') ?: '',
            'q' => trim((string) $request->query('q', '')),
        ];

        // Everything but the state: the state tabs count over it
        $base = Invoice::query();
        $this->applyPeriod($base, $filters['periodo']);
        if ($filters['area'] !== '') {
            InvoiceArea::scope($base, $filters['area']);
        }
        if ($filters['condicion'] !== '') {
            $filters['condicion'] === 'credito'
                ? $base->whereNotNull('credit_due_date')
                : $base->whereNull('credit_due_date');
        }
        if ($filters['cajero'] !== '') {
            $base->where('issued_by', $filters['cajero']);
        }
        if ($filters['q'] !== '') {
            $this->applySearch($base, $filters['q'], $searchPatients);
        }

        $listed = (clone $base)->when(
            $filters['estado'] !== 'todas',
            fn (Builder $q) => $q->where('status', $filters['estado']),
        );

        $page = (clone $listed)
            ->with(['patient', 'issuer', 'lines:id,invoice_id,type'])
            ->orderByDesc('issued_at')
            ->orderByDesc('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        $counts = (clone $base)->selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status');
        $selected = $request->integer('factura') ? Invoice::find($request->integer('factura')) : null;

        return Inertia::render('facturas/index', [
            'filters' => $filters,
            'period_label' => $this->periodLabel($filters['periodo']),
            'invoices' => [
                'data' => collect($page->items())->map(fn (Invoice $i): array => $this->row($i))->all(),
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'from' => $page->firstItem(),
                'to' => $page->lastItem(),
                'total' => $page->total(),
            ],
            'kpis' => $this->kpis($base),
            'totals' => $this->kpis($listed),
            'counts' => [
                'todas' => (int) $counts->sum(),
                ...collect(self::STATES)->mapWithKeys(fn (string $s) => [$s => (int) ($counts[$s] ?? 0)])->all(),
            ],
            'areas' => InvoiceArea::all(),
            'cashiers' => User::whereIn('id', Invoice::query()->distinct()->select('issued_by'))
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $u): array => ['id' => $u->id, 'name' => $u->name])
                ->all(),
            'selected_invoice' => $selected ? [
                ...$presenter->detail($selected),
                'area' => InvoiceArea::of($selected->lines->pluck('type')),
                'condition' => $selected->credit_due_date ? 'Crédito' : 'Contado',
            ] : null,
        ]);
    }

    /** @param  Builder<Invoice>  $query */
    private function applyPeriod(Builder $query, string $period): void
    {
        $now = Carbon::now(ClinicTime::TIMEZONE);
        $from = match ($period) {
            'hoy' => $now->copy()->startOfDay(),
            'semana' => $now->copy()->startOfDay()->subDays(6),
            'mes' => $now->copy()->startOfMonth(),
            default => null,
        };
        if ($from !== null) {
            $query->where('issued_at', '>=', $from->utc());
        }
    }

    private function periodLabel(string $period): string
    {
        $now = Carbon::now(ClinicTime::TIMEZONE)->locale('es');

        return match ($period) {
            'hoy' => 'Hoy · '.$now->format('d/m/Y'),
            'semana' => 'Del '.$now->copy()->subDays(6)->format('d/m').' al '.$now->format('d/m/Y'),
            'mes' => mb_convert_case($now->isoFormat('MMMM YYYY'), MB_CASE_TITLE),
            default => 'Todas las fechas',
        };
    }

    /**
     * Patient name or cédula (via SearchPatients, never LIKE on encrypted
     * columns) or the invoice number, with or without «F-» and zeros.
     *
     * @param  Builder<Invoice>  $query
     */
    private function applySearch(Builder $query, string $q, SearchPatients $searchPatients): void
    {
        $number = preg_match('/^F-?0*(\d+)$/i', $q, $m) ? (int) $m[1]
            : (preg_match('/^\d{1,7}$/', $q) ? (int) $q : null);

        $query->where(function (Builder $w) use ($q, $number, $searchPatients) {
            if (mb_strlen($q) >= 3) {
                $w->whereHas('patient', fn (Builder $p) => $searchPatients->applyTo($p, $q));
            }
            if ($number !== null) {
                $w->orWhere('id', $number);
            }
            if (mb_strlen($q) < 3 && $number === null) {
                $w->whereRaw('1 = 0');
            }
        });
    }

    /**
     * Billed, collected and pending money of the invoices; voided ones are
     * counted apart and are not money.
     *
     * @param  Builder<Invoice>  $query
     * @return array<string, int>
     */
    private function kpis(Builder $query): array
    {
        $row = (clone $query)->toBase()->selectRaw("
            coalesce(sum(case when status <> 'anulada' then total else 0 end), 0) as billed,
            coalesce(sum(case when status <> 'anulada' then 1 else 0 end), 0) as billed_count,
            coalesce(sum(case when status <> 'anulada' then paid_amount else 0 end), 0) as collected,
            coalesce(sum(case when status = 'pendiente' and total > paid_amount then total - paid_amount else 0 end), 0) as pending,
            coalesce(sum(case when status = 'pendiente' and total > paid_amount then 1 else 0 end), 0) as pending_count,
            coalesce(sum(case when status = 'anulada' then total else 0 end), 0) as voided,
            coalesce(sum(case when status = 'anulada' then 1 else 0 end), 0) as voided_count
        ")->first();

        return array_map('intval', (array) $row);
    }

    /** @return array<string, mixed> */
    private function row(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'number' => $invoice->number,
            'status' => $invoice->status,
            'issued_on' => $invoice->issued_at->copy()->setTimezone(ClinicTime::TIMEZONE)->format('d/m/Y'),
            'issued_time' => ClinicTime::time($invoice->issued_at),
            'patient' => [
                'id' => $invoice->patient->id,
                'full_name' => $invoice->patient->full_name,
                'document_number' => $invoice->patient->document_number,
            ],
            'area' => InvoiceArea::of($invoice->lines->map(fn (InvoiceLine $l) => $l->type)),
            'condition' => $invoice->credit_due_date ? 'Crédito' : 'Contado',
            'total' => $invoice->total,
            'paid_amount' => $invoice->paid_amount,
            'balance' => $invoice->balance(),
            'cashier' => $invoice->issuer->name,
        ];
    }
}
