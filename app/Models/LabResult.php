<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $lab_order_item_id
 * @property int|null $lab_test_parameter_id
 * @property int $position
 * @property string $name
 * @property string $reference
 * @property string|null $value
 * @property bool $out_of_range
 */
class LabResult extends Model
{
    protected $fillable = ['lab_order_item_id', 'lab_test_parameter_id', 'position', 'name', 'reference', 'value', 'out_of_range'];

    protected function casts(): array
    {
        return ['position' => 'integer', 'out_of_range' => 'boolean'];
    }
}
