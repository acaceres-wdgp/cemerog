<?php

namespace App\Support;

use App\Models\LabOrder;
use App\Models\LabOrderItem;
use App\Models\LabTest;
use App\Models\StudyCategory;
use App\Models\User;

/** Shapes the lab catalog and orders for Consulta, Emergencia and Laboratorio */
class LabPresenter
{
    /**
     * Active analyses to order.
     *
     * @return list<array<string, mixed>>
     */
    public function catalog(): array
    {
        $order = array_flip(StudyCategory::names('laboratorio'));

        return LabTest::where('is_active', true)->orderBy('name')->get()
            ->sortBy(fn (LabTest $t): int => $order[$t->category] ?? 99)
            ->map(fn (LabTest $t): array => [
                'id' => $t->id,
                'code' => $t->code,
                'name' => $t->name,
                'category' => $t->category,
                'price' => $t->price,
                'preparation' => $t->preparation,
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    public function summary(LabOrder $order): array
    {
        $order->loadMissing('items');

        return [
            'id' => $order->id,
            'number' => $order->number,
            'status' => $order->status,
            'ordered_at' => $order->ordered_at->format('d/m/Y H:i'),
            'ordered_time' => $order->ordered_at->format('H:i'),
            'tests' => $order->items->map(fn (LabOrderItem $i): string => $i->name)->all(),
            'total' => (int) $order->items->sum('price'),
            'indication' => $order->indication,
            'cancel_reason' => $order->cancel_reason,
        ];
    }

    /**
     * Summary plus the results once validated (Consulta, Emergencia).
     *
     * @return array<string, mixed>
     */
    public function withResults(LabOrder $order): array
    {
        $order->loadMissing('items.results');
        $done = in_array($order->status, ['validada', 'entregada'], true);

        return [
            ...$this->summary($order),
            'validated_at' => $order->validated_at?->format('d/m/Y H:i'),
            'results' => $done ? $this->flatResults($order) : [],
        ];
    }

    /** @return list<array{test: string, name: string, value: string|null, reference: string, out_of_range: bool}> */
    public function flatResults(LabOrder $order): array
    {
        $rows = [];
        foreach ($order->items as $item) {
            foreach ($item->results as $r) {
                $rows[] = [
                    'test' => $item->name,
                    'name' => $r->name,
                    'value' => $r->value,
                    'reference' => $r->reference,
                    'out_of_range' => $r->out_of_range,
                ];
            }
        }

        return $rows;
    }

    public const ORIGINS = [
        'consulta' => 'Consulta',
        'emergencia' => 'Emergencia',
        'internamiento' => 'Internamiento',
        'externo' => 'Sin consulta',
    ];

    /**
     * A row of the queue or the history.
     *
     * @return array<string, mixed>
     */
    public function row(LabOrder $order): array
    {
        $order->loadMissing(['patient', 'doctor', 'items.results']);
        $p = $order->patient;

        return [
            ...$this->summary($order),
            'ordered_date' => $order->ordered_at->format('d/m/Y'),
            'origin' => self::ORIGINS[$order->origin] ?? $order->origin,
            'doctor' => $order->doctor_id !== null ? $order->doctor->name : $order->external_doctor,
            'patient' => [
                'id' => $p->id,
                'full_name' => $p->full_name,
                'age' => $p->age,
                'sex' => $p->sex,
                'document_number' => $p->document_type === 'no_tiene' ? null : $p->document_number,
            ],
            'has_out_of_range' => $order->items->contains(fn (LabOrderItem $i): bool => $i->results->contains('out_of_range', true)),
            'validated_at' => $order->validated_at?->format('d/m/Y H:i'),
        ];
    }

    /**
     * Detail with the results by category.
     *
     * @return array<string, mixed>
     */
    public function detail(LabOrder $order, bool $canValidate): array
    {
        $order->loadMissing(['items.results', 'items.test']);
        $byCategory = [];
        foreach ($order->items as $item) {
            foreach ($item->results as $r) {
                $byCategory[$item->category]['tests'][$item->name] = true;
                $byCategory[$item->category]['results'][] = [
                    'id' => $r->id,
                    'code' => $item->test->code,
                    'test' => $item->name,
                    'name' => $r->name,
                    'reference' => $r->reference,
                    'value' => $r->value,
                    'out_of_range' => $r->out_of_range,
                ];
            }
        }
        $order_ = array_flip(StudyCategory::names('laboratorio'));
        uksort($byCategory, fn (string $a, string $b): int => ($order_[$a] ?? 99) <=> ($order_[$b] ?? 99));

        return [
            ...$this->row($order),
            'sample_at' => $order->sample_at?->format('d/m/Y H:i'),
            'validated_by' => $order->validated_by !== null ? User::find($order->validated_by)?->name : null,
            'delivered_at' => $order->delivered_at?->format('d/m/Y H:i'),
            'can_validate' => $canValidate,
            'categories' => array_map(fn (string $category, array $data): array => [
                'category' => $category,
                'tests' => array_keys($data['tests']),
                'results' => $data['results'],
            ], array_keys($byCategory), $byCategory),
            'preparations' => $order->items->map(fn (LabOrderItem $i): ?string => $i->test->preparation)->filter()->unique()->values()->all(),
        ];
    }
}
