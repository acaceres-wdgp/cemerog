<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Caja\CreateInvoice;
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
    public function store(StoreInvoiceRequest $request, Account $account, CreateInvoice $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $invoice = $action->handle(
            $account,
            $user,
            $data['discount_type'] ?? null,
            isset($data['discount_value']) ? (int) $data['discount_value'] : null,
            $data['discount_reason'] ?? null,
        );

        Toast::success("Factura {$invoice->number} emitida.");

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
