<?php

namespace App\Support;

use App\Models\Account;
use App\Models\AccountCharge;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Payment;
use App\Models\Receipt;

/** Shapes accounts and invoices for the billing pages */
class InvoicePresenter
{
    /** Area shown for each charge type */
    private const AREAS = [
        'consulta' => 'Consulta',
        'emergencia' => 'Emergencia',
        'insumo' => 'Insumos',
        'laboratorio' => 'Laboratorio',
        'imagen' => 'Imágenes',
        'habitacion' => 'Habitación',
        'medicamento' => 'Farmacia',
        'procedimiento' => 'Procedimiento',
        'otro' => 'Otro',
    ];

    /** «Laboratorio», «Habitación»… for a charge type */
    public static function area(string $type): string
    {
        return self::AREAS[$type] ?? $type;
    }

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
                'date' => $c->created_at?->format('d/m/Y'),
                'area' => self::AREAS[$c->type] ?? $c->type,
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
            'credit_due_date' => $invoice->credit_due_date?->format('d/m/Y'),
        ];
    }

    /** @return array<string, mixed> */
    public function receiptRow(Receipt $receipt): array
    {
        return [
            'id' => $receipt->id,
            'number' => $receipt->number,
            'created_at' => $receipt->created_at?->format('d/m/Y H:i'),
            'created_by' => $receipt->creator->name,
            'total' => $receipt->total,
            'voided' => $receipt->voided_at !== null,
            'void_reason' => $receipt->void_reason,
            'payments' => $receipt->payments->map(fn (Payment $p): array => [
                'method' => $p->method,
                'amount' => $p->amount,
                'cash_received' => $p->cash_received,
                'change_given' => $p->change_given,
                'reference' => $p->reference,
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function receipt(Receipt $receipt): array
    {
        $receipt->loadMissing(['payments', 'creator', 'invoice.patient']);

        return [
            ...$this->receiptRow($receipt),
            'invoice' => [
                'number' => $receipt->invoice->number,
                'total' => $receipt->invoice->total,
                'paid_amount' => $receipt->invoice->paid_amount,
                'balance' => $receipt->invoice->balance(),
            ],
            'patient' => $receipt->invoice->patient->full_name,
        ];
    }

    /** @return array<string, mixed> */
    public function detail(Invoice $invoice): array
    {
        $invoice->loadMissing(['patient', 'issuer', 'voider', 'lines.doctor', 'lines.accountCharge', 'account', 'receipts.payments', 'receipts.creator']);

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
            'credit_note' => $invoice->credit_note,
            'receipts' => $invoice->receipts->sortBy('id')->map(fn (Receipt $r): array => $this->receiptRow($r))->values()->all(),
            'void_reason' => $invoice->void_reason,
            'voided_by' => $invoice->voider?->name,
            'voided_at' => $invoice->voided_at?->format('d/m/Y H:i'),
            'lines' => $invoice->lines->map(fn (InvoiceLine $l): array => [
                'id' => $l->id,
                'date' => ($l->accountCharge->created_at ?? $invoice->issued_at)->format('d/m/Y'),
                'area' => self::AREAS[$l->type] ?? $l->type,
                'description' => $l->description,
                'quantity' => $l->quantity,
                'unit_price' => $l->unit_price,
                'total' => $l->total,
                'doctor' => $l->doctor?->name,
            ])->values()->all(),
        ];
    }
}
