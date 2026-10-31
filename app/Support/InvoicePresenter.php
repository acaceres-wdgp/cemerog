<?php

namespace App\Support;

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Invoice;
use App\Models\InvoiceLine;

/** Shapes accounts and invoices for the billing pages */
class InvoicePresenter
{
    /** @return array<string, mixed> */
    public function account(Account $account): array
    {
        return [
            'id' => $account->id,
            'service_date' => $account->service_date->format('d/m/Y'),
            'status' => $account->status,
            'patient' => [
                'id' => $account->patient->id,
                'full_name' => $account->patient->full_name,
                'expediente_number' => $account->patient->expediente_number,
            ],
            'charges' => $account->charges->map(fn (AccountCharge $c): array => [
                'id' => $c->id,
                'description' => $c->description,
                'quantity' => $c->quantity,
                'unit_price' => $c->unit_price,
                'total' => $c->total,
                'doctor' => $c->doctor?->name,
            ])->values()->all(),
            'total' => (int) $account->charges->sum('total'),
        ];
    }

    /** @return array<string, mixed> */
    public function summary(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'number' => $invoice->number,
            'status' => $invoice->status,
            'patient' => $invoice->patient->full_name,
            'issued_at' => $invoice->issued_at->format('d/m/Y H:i'),
            'total' => $invoice->total,
            'paid_amount' => $invoice->paid_amount,
            'balance' => $invoice->balance(),
        ];
    }

    /** @return array<string, mixed> */
    public function detail(Invoice $invoice): array
    {
        $invoice->loadMissing(['patient', 'issuer', 'voider', 'lines.doctor', 'account']);

        return [
            ...$this->summary($invoice),
            'patient' => [
                'id' => $invoice->patient->id,
                'full_name' => $invoice->patient->full_name,
                'expediente_number' => $invoice->patient->expediente_number,
                'document_number' => $invoice->patient->document_number,
            ],
            'service_date' => $invoice->account->service_date->format('d/m/Y'),
            'issued_by' => $invoice->issuer->name,
            'subtotal' => $invoice->subtotal,
            'discount_type' => $invoice->discount_type,
            'discount_value' => $invoice->discount_value,
            'discount_amount' => $invoice->discount_amount,
            'discount_reason' => $invoice->discount_reason,
            'credit_due_date' => $invoice->credit_due_date?->format('d/m/Y'),
            'void_reason' => $invoice->void_reason,
            'voided_by' => $invoice->voider?->name,
            'voided_at' => $invoice->voided_at?->format('d/m/Y H:i'),
            'lines' => $invoice->lines->map(fn (InvoiceLine $l): array => [
                'id' => $l->id,
                'description' => $l->description,
                'quantity' => $l->quantity,
                'unit_price' => $l->unit_price,
                'total' => $l->total,
                'doctor' => $l->doctor?->name,
            ])->values()->all(),
        ];
    }
}
