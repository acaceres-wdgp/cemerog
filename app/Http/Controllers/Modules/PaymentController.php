<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Caja\RecordPayment;
use App\Actions\Caja\VoidReceipt;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\VoidReceiptRequest;
use App\Models\Invoice;
use App\Models\Receipt;
use App\Models\User;
use App\Support\InvoicePresenter;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function store(StorePaymentRequest $request, Invoice $invoice, RecordPayment $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $receipt = $action->handle($invoice, $user, $request->paymentLines(), $request->creditTerms());

        Toast::success($receipt !== null
            ? "Pago registrado. Recibo {$receipt->number}."
            : 'Balance enviado a cuentas por cobrar.');

        // The page offers to print the receipt right away
        if ($receipt !== null) {
            Inertia::flash('receipt', ['id' => $receipt->id, 'number' => $receipt->number]);
        }

        return back();
    }

    public function void(VoidReceiptRequest $request, Receipt $receipt, VoidReceipt $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $action->handle($receipt, $user, (string) $request->validated('void_reason'));

        Toast::success("Recibo {$receipt->number} anulado.");

        return back();
    }

    public function print(Receipt $receipt, InvoicePresenter $presenter): Response
    {
        return Inertia::render('caja/recibo-imprimir', [
            'receipt' => $presenter->receipt($receipt),
            'clinic' => [
                'name' => config('cemerog.clinic.name'),
                'rnc' => config('cemerog.clinic.rnc'),
                'phone' => config('cemerog.clinic.phone'),
                'address' => config('cemerog.clinic.address'),
            ],
        ]);
    }
}
