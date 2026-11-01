<?php

namespace App\Support;

use App\Models\LabOrder;
use App\Models\LabOrderItem;
use App\Models\LabTest;

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
        $order = array_flip(LabTest::CATEGORIES);

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
}
