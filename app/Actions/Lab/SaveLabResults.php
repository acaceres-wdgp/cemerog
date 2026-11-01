<?php

namespace App\Actions\Lab;

use App\Models\LabOrder;
use App\Models\LabResult;
use App\Models\LabTestParameter;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Saves the results of an order (flagging those out of range) and, when
 * asked, validates it: then every result must have a value.
 */
class SaveLabResults
{
    /** @param array<int|string, string|null> $values result id => value */
    public function handle(LabOrder $order, array $values, User $user, bool $validate = false): LabOrder
    {
        return DB::transaction(function () use ($order, $values, $user, $validate): LabOrder {
            $order = LabOrder::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if (! in_array($order->status, ['muestra', 'ingresado'], true)) {
                throw ValidationException::withMessages(['order' => $order->status === 'ordenada'
                    ? 'Registra primero la toma de muestra.'
                    : 'Esta orden ya fue validada; sus resultados no se modifican.']);
            }

            $results = LabResult::whereIn('lab_order_item_id', $order->items()->pluck('id'))->get();
            foreach ($results as $result) {
                if (! array_key_exists($result->id, $values) && ! array_key_exists((string) $result->id, $values)) {
                    continue;
                }
                $value = trim((string) ($values[$result->id] ?? $values[(string) $result->id] ?? ''));
                $parameter = $result->lab_test_parameter_id !== null ? LabTestParameter::find($result->lab_test_parameter_id) : null;
                if ($parameter?->result_type === 'texto') {
                    $value = mb_strtoupper($value);
                }
                $result->update([
                    'value' => $value === '' ? null : $value,
                    'out_of_range' => $parameter?->isOutOfRange($value) ?? false,
                ]);
            }

            if ($validate) {
                if ($results->contains(fn (LabResult $r): bool => $r->fresh()?->value === null)) {
                    throw ValidationException::withMessages(['results' => 'Completa todos los resultados antes de validar.']);
                }
                $order->update(['status' => 'validada', 'validated_at' => now(), 'validated_by' => $user->id]);
            } elseif ($results->contains(fn (LabResult $r): bool => $r->fresh()?->value !== null)) {
                $order->update(['status' => 'ingresado']);
            }

            return $order;
        });
    }
}
