<?php

namespace App\Actions\Patients;

use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Receipt;
use Illuminate\Support\Collection;

/**
 * Invoices and payments received of a patient, for the Finanzas tab.
 */
class BuildPatientBilling
{
    private const METHODS = [
        'efectivo' => 'Efectivo',
        'tarjeta' => 'Tarjeta',
        'transferencia' => 'Transferencia',
    ];

    /**
     * @return array{facturas: list<array<string, mixed>>, pagos: list<array<string, mixed>>, total_facturado: int, total_pagado: int, saldo: int}
     */
    public function handle(Patient $patient): array
    {
        $invoices = Invoice::with(['receipts.payments'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('issued_at')
            ->orderByDesc('id')
            ->get();

        $valid = $invoices->where('status', '!=', 'anulada');

        return [
            'facturas' => $invoices->map(fn (Invoice $i): array => [
                'id' => $i->id,
                'number' => $i->number,
                'issued_on' => $i->issued_at->format('d/m/Y'),
                'total' => $i->total,
                'paid_amount' => $i->paid_amount,
                'balance' => $i->balance(),
                'status' => $i->status,
                'credit_due_date' => $i->credit_due_date?->format('d/m/Y'),
            ])->values()->all(),
            'pagos' => $this->payments($invoices),
            'total_facturado' => (int) $valid->sum('total'),
            'total_pagado' => (int) $valid->sum('paid_amount'),
            'saldo' => (int) $valid->sum(fn (Invoice $i): int => $i->balance()),
        ];
    }

    /**
     * Every receipt, newest first, with its kind: «Pago total» when one
     * receipt pays the whole invoice, «Abono parcial» while a balance remains
     * and «Liquidación» for the one that settles it after earlier payments.
     *
     * @param  Collection<int, Invoice>  $invoices
     * @return list<array<string, mixed>>
     */
    private function payments(Collection $invoices): array
    {
        $rows = [];

        foreach ($invoices as $invoice) {
            $paid = 0;
            foreach ($invoice->receipts->sortBy('id') as $receipt) {
                $kind = 'Anulado';
                if ($receipt->voided_at === null) {
                    $before = $paid;
                    $paid += $receipt->total;
                    $kind = $paid < $invoice->total ? 'Abono parcial' : ($before > 0 ? 'Liquidación' : 'Pago total');
                }
                $rows[] = $this->row($receipt, $invoice, $kind);
            }
        }

        usort($rows, fn (array $a, array $b): int => $b['id'] <=> $a['id']);

        return $rows;
    }

    /** @return array<string, mixed> */
    private function row(Receipt $receipt, Invoice $invoice, string $kind): array
    {
        return [
            'id' => $receipt->id,
            'number' => $receipt->number,
            'date' => $receipt->created_at?->format('d/m/Y'),
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoice->number,
            'methods' => $receipt->payments
                ->map(fn (Payment $p): string => self::METHODS[$p->method] ?? $p->method)
                ->unique()
                ->implode(' + '),
            'amount' => $receipt->total,
            'kind' => $kind,
            'voided' => $receipt->voided_at !== null,
        ];
    }
}
