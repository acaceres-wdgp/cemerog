<?php

namespace App\Actions\Img;

use App\Models\ImagingOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Saves the report as a draft or, when asked, signs it: then findings and
 * conclusion are required and the report can no longer be changed.
 */
class SaveImagingReport
{
    public function handle(ImagingOrder $order, ?string $findings, ?string $conclusion, User $user, bool $sign = false): ImagingOrder
    {
        return DB::transaction(function () use ($order, $findings, $conclusion, $user, $sign): ImagingOrder {
            $order = ImagingOrder::whereKey($order->id)->lockForUpdate()->firstOrFail();
            if (! $order->isReportEditable()) {
                throw ValidationException::withMessages(['order' => $order->status === 'ordenada'
                    ? 'Registra primero que el estudio fue realizado.'
                    : 'Este informe ya fue firmado; no se modifica.']);
            }

            $findings = $findings !== null && trim($findings) !== '' ? trim($findings) : null;
            $conclusion = $conclusion !== null && trim($conclusion) !== '' ? trim($conclusion) : null;

            if ($sign && ($findings === null || $conclusion === null)) {
                throw ValidationException::withMessages(['report' => 'Completa hallazgos y conclusión antes de firmar.']);
            }

            $order->update([
                'findings' => $findings,
                'conclusion' => $conclusion,
                ...($sign
                    ? ['status' => 'listo', 'signed_at' => now(), 'signed_by' => $user->id]
                    : ['status' => 'borrador']),
            ]);

            return $order;
        });
    }
}
