<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Caja\IssueInvoice;
use App\Actions\Caja\VoidInvoice;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvoiceRequest;
use App\Http\Requests\VoidInvoiceRequest;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\User;
use App\Support\InvoicePresenter;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function store(StoreInvoiceRequest $request, Account $account, IssueInvoice $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        ['invoice' => $invoice, 'receipt' => $receipt] = $action->handle(
            $account,
            $user,
            [
                'type' => $data['discount_type'] ?? null,
                'value' => isset($data['discount_value']) ? (int) $data['discount_value'] : null,
                'reason' => $data['discount_reason'] ?? null,
            ],
            $request->paymentLines(),
            $request->creditTerms(),
        );

        Toast::success(match (true) {
            $invoice->status === 'pagada' => "Factura {$invoice->number} emitida y saldada.",
            $receipt !== null => "Factura {$invoice->number} emitida. Recibo {$receipt->number}.",
            default => "Factura {$invoice->number} emitida.",
        });

        return redirect()->route('caja', ['factura' => $invoice->id]);
    }

    public function void(VoidInvoiceRequest $request, Invoice $invoice, VoidInvoice $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $action->handle($invoice, $user, (string) $request->validated('void_reason'));

        Toast::success("Factura {$invoice->number} anulada.");

        return redirect()->route('caja');
    }

    public function print(Invoice $invoice, InvoicePresenter $presenter): Response
    {
        return Inertia::render('caja/factura-imprimir', [
            'invoice' => $presenter->detail($invoice),
            'clinic' => [
                'name' => config('cemerog.clinic.name'),
                'rnc' => config('cemerog.clinic.rnc'),
                'phone' => config('cemerog.clinic.phone'),
                'address' => config('cemerog.clinic.address'),
            ],
        ]);
    }
}
