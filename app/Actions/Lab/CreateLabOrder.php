<?php

namespace App\Actions\Lab;

use App\Models\LabOrder;
use App\Models\LabTest;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * A laboratory order. Nothing is charged here: the charge is created when
 * the sample is taken, so an order done elsewhere is simply cancelled.
 */
class CreateLabOrder
{
    /**
     * @param  list<int>  $testIds
     * @param  array{turn_id?: int|null, emergency_id?: int|null, doctor_id?: int|null, external_doctor?: string|null}  $context
     */
    public function handle(Patient $patient, string $origin, array $context, array $testIds, ?string $indication, User $user): LabOrder
    {
        return DB::transaction(function () use ($patient, $origin, $context, $testIds, $indication, $user): LabOrder {
            $order = LabOrder::create([
                ...$context,
                'patient_id' => $patient->id,
                'origin' => $origin,
                'indication' => $indication !== null && trim($indication) !== '' ? trim($indication) : null,
                'status' => 'ordenada',
                'ordered_at' => now(),
                'created_by' => $user->id,
            ]);
            $order->update(['number' => sprintf('L-%04d', $order->id)]);

            $tests = LabTest::whereIn('id', $testIds)->get()->keyBy('id');
            foreach ($testIds as $id) {
                $test = $tests[$id];
                $order->items()->create([
                    'lab_test_id' => $test->id,
                    'name' => $test->name,
                    'category' => $test->category,
                    'price' => $test->price,
                ]);
            }

            return $order;
        });
    }
}
