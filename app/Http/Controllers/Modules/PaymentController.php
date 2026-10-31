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
        $data = $request->validated();

        $lines = array_map(fn (array $p): array => [
            'method' => (string) $p['method'],
            'amount' => (int) $p['amount'],
            'cash_received' => isset($p['cash_received']) ? (int) $p['cash_received'] : null,
            'reference' => $p['reference'] ?? null,
        ], $data['payments']);

        $credit = isset($data['credit']['due_date']) && $data['credit']['due_date'] !== ''
            ? ['due_date' => (string) $data['credit']['due_date'], 'note' => $data['credit']['note'] ?? null]
            : null;

        $receipt = $action->handle($invoice, $user, array_values($lines), $credit);

        Toast::success($receipt !== null
            ? "Pago registrado. Recibo {$receipt->number}."
            : 'Balance enviado a cuentas por cobrar.');

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
