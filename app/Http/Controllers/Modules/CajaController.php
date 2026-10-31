<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\User;
use App\Support\InvoicePresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Facturación: accounts to invoice, accounts still in care and invoices */
class CajaController extends Controller
{
    public function index(Request $request, InvoicePresenter $presenter): Response
    {
        /** @var User $user */
        $user = $request->user();

        $pending = Account::with(['patient', 'charges.doctor'])
            ->where('status', 'pendiente_facturar')
            ->orderBy('service_date')
            ->orderBy('id')
            ->get();

        $inCare = Account::with(['patient', 'charges.doctor'])
            ->where('status', 'abierta')
            ->orderBy('opened_at')
            ->get();

        $invoices = Invoice::with('patient')
            ->where(fn ($q) => $q->whereDate('issued_at', today())->orWhere('status', 'pendiente'))
            ->orderByDesc('issued_at')
            ->limit(50)
            ->get();

        $selectedId = $request->integer('factura');
        $selected = $selectedId ? Invoice::find($selectedId) : null;

        return Inertia::render('caja/index', [
            'pending_accounts' => $pending->map(fn (Account $a) => $presenter->account($a))->all(),
            'accounts_in_care' => $inCare->map(fn (Account $a) => $presenter->account($a))->all(),
            'invoices' => $invoices->map(fn (Invoice $i) => $presenter->summary($i))->all(),
            'selected_invoice' => $selected ? $presenter->detail($selected) : null,
            'can_void' => $user->hasRole('administrador'),
        ]);
    }
}
