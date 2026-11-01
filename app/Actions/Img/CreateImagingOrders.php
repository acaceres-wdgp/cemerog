<?php

namespace App\Actions\Img;

use App\Models\ImagingOrder;
use App\Models\ImagingStudy;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * One imaging order per study. Nothing is charged here: the charge is
 * created when the study is performed (ADR-018).
 */
class CreateImagingOrders
{
    /**
     * @param  list<int>  $studyIds
     * @param  array{turn_id?: int|null, emergency_id?: int|null, doctor_id?: int|null, external_doctor?: string|null}  $context
     * @return list<ImagingOrder>
     */
    public function handle(Patient $patient, string $origin, array $context, array $studyIds, ?string $indication, User $user): array
    {
        return DB::transaction(function () use ($patient, $origin, $context, $studyIds, $indication, $user): array {
            $studies = ImagingStudy::whereIn('id', $studyIds)->get()->keyBy('id');
            $orders = [];
            foreach ($studyIds as $id) {
                $study = $studies[$id];
                $order = ImagingOrder::create([
                    ...$context,
                    'patient_id' => $patient->id,
                    'imaging_study_id' => $study->id,
                    'name' => $study->name,
                    'modality' => $study->modality,
                    'price' => $study->price,
                    'origin' => $origin,
                    'indication' => $indication !== null && trim($indication) !== '' ? trim($indication) : null,
                    'status' => 'ordenada',
                    'ordered_at' => now(),
                    'created_by' => $user->id,
                ]);
                $order->update(['number' => sprintf('I-%04d', $order->id)]);
                $orders[] = $order;
            }

            return $orders;
        });
    }
}
