<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $emergency_id
 * @property int|null $admission_id Internamiento reuses these readings
 * @property string $presion_arterial
 * @property int $frecuencia_cardiaca
 * @property int $frecuencia_respiratoria
 * @property int $temp °C × 10
 * @property int $saturacion_o2
 * @property int|null $glucemia
 * @property Carbon $taken_at
 * @property int $taken_by
 * @property-read User $taker
 */
class EmergencyVital extends Model
{
    protected $fillable = [
        'emergency_id', 'admission_id', 'presion_arterial', 'frecuencia_cardiaca', 'frecuencia_respiratoria',
        'temp', 'saturacion_o2', 'glucemia', 'taken_at', 'taken_by',
    ];

    protected function casts(): array
    {
        return [
            'frecuencia_cardiaca' => 'integer',
            'frecuencia_respiratoria' => 'integer',
            'temp' => 'integer',
            'saturacion_o2' => 'integer',
            'glucemia' => 'integer',
            'taken_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function taker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'taken_by');
    }

    /** «PA 145/90 · FC 98 · SpO₂ 93 %» for the board */
    public function summary(): string
    {
        return "PA {$this->presion_arterial} · FC {$this->frecuencia_cardiaca} · SpO₂ {$this->saturacion_o2} %";
    }
}
