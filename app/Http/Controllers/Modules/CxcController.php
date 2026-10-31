<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\User;
use App\Support\InvoicePresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Cuentas por cobrar: issued invoices with a balance */
class CxcController extends Controller
{
    public function index(Request $request, InvoicePresenter $presenter): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filter = $request->string('filtro', 'todas')->toString();

        $receivable = Invoice::with('patient')
            ->where('status', 'pendiente')
            ->whereColumn('paid_amount', '<', 'total')
            ->orderByRaw('credit_due_date is null')
            ->orderBy('credit_due_date')
            ->orderBy('issued_at')
            ->get();

        $isOverdue = fn (Invoice $i): bool => $i->credit_due_date !== null && $i->credit_due_date->lt(today());

        $rows = $receivable
            ->filter(fn (Invoice $i): bool => match ($filter) {
                'vencidas' => $isOverdue($i),
                'al_dia' => ! $isOverdue($i),
                default => true,
            })
            ->map(fn (Invoice $i): array => [...$presenter->summary($i), 'overdue' => $isOverdue($i)])
            ->values()
            ->all();

        $selectedId = $request->integer('factura');
        $selected = $selectedId ? Invoice::find($selectedId) : null;

        return Inertia::render('cxc/index', [
            'invoices' => $rows,
            'totals' => [
                'receivable' => $receivable->sum(fn (Invoice $i): int => $i->balance()),
                'overdue' => $receivable->filter($isOverdue)->sum(fn (Invoice $i): int => $i->balance()),
                'count' => $receivable->count(),
                'overdue_count' => $receivable->filter($isOverdue)->count(),
            ],
            'filter' => in_array($filter, ['todas', 'vencidas', 'al_dia'], true) ? $filter : 'todas',
            'selected_invoice' => $selected ? $presenter->detail($selected) : null,
            'can_void' => $user->hasRole('administrador'),
        ]);
    }
}
