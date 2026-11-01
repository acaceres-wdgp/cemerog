<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A procedure of the surgery catalog.
 *
 * @property int $id
 * @property string $code Q-01
 * @property string $name
 * @property int $price centavos
 * @property int $duration_minutes
 * @property bool $is_active
 */
class SurgeryProcedure extends Model
{
    protected $fillable = ['code', 'name', 'price', 'duration_minutes', 'is_active'];

    protected function casts(): array
    {
        return ['price' => 'integer', 'duration_minutes' => 'integer', 'is_active' => 'boolean'];
    }
}
