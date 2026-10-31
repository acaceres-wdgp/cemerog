<?php

namespace App\Http\Requests\Concerns;

use App\Models\Payment;
use Illuminate\Validation\Rule;

/** Validation and normalization of the payment part of a request */
trait PaymentRules
{
    /** @return array<string, mixed> */
    protected function paymentRules(): array
    {
        return [
            'payments' => ['nullable', 'array', 'max:3'],
            'payments.*.method' => ['required', Rule::in(Payment::METHODS)],
            'payments.*.amount' => ['required', 'integer', 'min:0'],
            'payments.*.cash_received' => ['nullable', 'integer', 'min:0'],
            'payments.*.reference' => ['nullable', 'string', 'max:100'],
            'credit' => ['nullable', 'array'],
            'credit.due_date' => ['nullable', 'date'],
            'credit.note' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return list<array{method: string, amount: int, cash_received: int|null, reference: string|null}> */
    public function paymentLines(): array
    {
        /** @var list<array<string, mixed>> $payments */
        $payments = $this->validated('payments') ?? [];

        return array_map(fn (array $p): array => [
            'method' => (string) $p['method'],
            'amount' => (int) $p['amount'],
            'cash_received' => isset($p['cash_received']) ? (int) $p['cash_received'] : null,
            'reference' => isset($p['reference']) ? (string) $p['reference'] : null,
        ], $payments);
    }

    /** @return array{due_date: string, note: string|null}|null */
    public function creditTerms(): ?array
    {
        $due = $this->validated('credit.due_date');

        return $due !== null && $due !== ''
            ? ['due_date' => (string) $due, 'note' => $this->validated('credit.note')]
            : null;
    }
}
