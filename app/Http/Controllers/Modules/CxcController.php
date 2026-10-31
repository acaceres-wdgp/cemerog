<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Cuentas por cobrar: every issued invoice with a balance, oldest first.
 * The clinic is small, so the page gets all of them and filters by age and
 * search on the client.
 */
class CxcController extends Controller
{
    public function index(): Response
    {
        $today = today();

        $invoices = Invoice::with('patient')
            ->where('status', 'pendiente')
            ->whereColumn('paid_amount', '<', 'total')
            ->orderBy('issued_at')
            ->orderBy('id')
            ->get()
            ->map(fn (Invoice $i): array => [
                'id' => $i->id,
                'number' => $i->number,
                'issued_on' => $i->issued_at->format('d/m/Y'),
                'days' => (int) $i->issued_at->copy()->startOfDay()->diffInDays($today),
                'total' => $i->total,
                'paid_amount' => $i->paid_amount,
                'balance' => $i->balance(),
                'credit_due_date' => $i->credit_due_date?->format('d/m/Y'),
                'overdue' => $i->credit_due_date !== null && $i->credit_due_date->lt($today),
                'patient' => [
                    'id' => $i->patient->id,
                    'full_name' => $i->patient->full_name,
                    'document_number' => $i->patient->document_number,
                    'phone' => $i->patient->phone,
                ],
            ])
            ->values()
            ->all();

        return Inertia::render('cxc/index', ['invoices' => $invoices]);
    }
}
