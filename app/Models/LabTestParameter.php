<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A parameter of an analysis and its reference value.
 *
 * @property int $id
 * @property int $lab_test_id
 * @property int $position
 * @property string $name
 * @property string $result_type numerico | texto
 * @property string|null $unit
 * @property string|null $min
 * @property string|null $max
 * @property string|null $normal_text
 */
class LabTestParameter extends Model
{
    protected $fillable = ['lab_test_id', 'position', 'name', 'result_type', 'unit', 'min', 'max', 'normal_text'];

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    /** «70 – 100 mg/dL», «Menor de 6 mg/L», «NEGATIVO» */
    public function referenceText(): string
    {
        if ($this->result_type === 'texto') {
            return $this->normal_text ?? '—';
        }

        $unit = $this->unit !== null && $this->unit !== '' ? ' '.$this->unit : '';
        $min = $this->min !== null ? self::number($this->min) : null;
        $max = $this->max !== null ? self::number($this->max) : null;

        return match (true) {
            $min !== null && $max !== null => "{$min} – {$max}{$unit}",
            $max !== null => "Hasta {$max}{$unit}",
            $min !== null => "Desde {$min}{$unit}",
            default => trim($unit) ?: '—',
        };
    }

    /** True when a result is outside the reference; an empty result is not flagged */
    public function isOutOfRange(?string $value): bool
    {
        $value = trim((string) $value);
        if ($value === '') {
            return false;
        }

        if ($this->result_type === 'texto') {
            return $this->normal_text !== null && mb_strtoupper($value) !== $this->normal_text;
        }

        $number = str_replace(',', '.', $value);
        if (! is_numeric($number)) {
            return false;
        }

        return ($this->min !== null && (float) $number < (float) $this->min)
            || ($this->max !== null && (float) $number > (float) $this->max);
    }

    /** 4.500 → 4.5, 100.000 → 100 */
    private static function number(string $value): string
    {
        return rtrim(rtrim(number_format((float) $value, 3, '.', ''), '0'), '.');
    }
}
