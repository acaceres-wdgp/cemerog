<?php

namespace App\Actions\Emergencia;

use App\Models\Emergency;
use App\Models\EmergencyApplication;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** A medication or supply applied in emergency (see RecordApplication) */
class ApplyToEmergency
{
    public function __construct(private readonly RecordApplication $record) {}

    public function handle(Emergency $emergency, User $user, string $kind, ?int $itemId, ?string $description, int $quantity, ?string $route): EmergencyApplication
    {
        return DB::transaction(function () use ($emergency, $user, $kind, $itemId, $description, $quantity, $route): EmergencyApplication {
            EnsureEmergencyActive::check($emergency);

            return $this->record->handle(['emergency_id' => $emergency->id], $emergency->account_id, $user, $kind, $itemId, $description, $quantity, $route);
        });
    }
}
