<?php

namespace App\Actions;

use App\Actions\Img\CreateImagingOrders;
use App\Actions\Lab\CreateLabOrder;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * «Ordenar estudios»: one laboratory order with every analysis and one
 * imaging order per study. Returns the numbers created, for the message.
 */
class OrderStudies
{
    public function __construct(
        private readonly CreateLabOrder $createLabOrder,
        private readonly CreateImagingOrders $createImagingOrders,
    ) {}

    /**
     * @param  array{turn_id?: int|null, emergency_id?: int|null, doctor_id?: int|null, external_doctor?: string|null}  $context
     * @param  list<int>  $labTestIds
     * @param  list<int>  $imagingStudyIds
     * @return list<string>
     */
    public function handle(Patient $patient, string $origin, array $context, array $labTestIds, array $imagingStudyIds, ?string $indication, User $user): array
    {
        return DB::transaction(function () use ($patient, $origin, $context, $labTestIds, $imagingStudyIds, $indication, $user): array {
            $numbers = [];
            if ($labTestIds !== []) {
                $numbers[] = (string) $this->createLabOrder->handle($patient, $origin, $context, $labTestIds, $indication, $user)->number;
            }
            foreach ($this->createImagingOrders->handle($patient, $origin, $context, $imagingStudyIds, $indication, $user) as $order) {
                $numbers[] = (string) $order->number;
            }

            return $numbers;
        });
    }

    /**
     * «Orden L-0003 enviada.» or «Órdenes L-0003 e I-0004 enviadas.»
     *
     * @param  list<string>  $numbers
     */
    public static function message(array $numbers): string
    {
        if (count($numbers) === 1) {
            return "Orden {$numbers[0]} enviada.";
        }
        $last = array_pop($numbers);
        $joiner = str_starts_with($last, 'I') ? ' e ' : ' y ';

        return 'Órdenes '.implode(', ', $numbers).$joiner.$last.' enviadas.';
    }
}
