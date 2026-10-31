<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Clinic settings that the administrator changes without a release.
 *
 * @property string $key
 * @property string|null $value
 */
class Setting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public static function get(string $key, ?string $default = null): ?string
    {
        return static::query()->find($key)->value ?? $default;
    }

    public static function put(string $key, ?string $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /** Charge for an emergency attention, in centavos */
    public static function emergencyFee(): int
    {
        return (int) static::get('emergency_fee', '0');
    }
}
