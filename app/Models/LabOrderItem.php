<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $lab_order_id
 * @property int $lab_test_id
 * @property string $name
 * @property string $category
 * @property int $price
 * @property int|null $account_charge_id
 * @property-read LabTest $test
 * @property-read Collection<int, LabResult> $results
 */
class LabOrderItem extends Model
{
    protected $fillable = ['lab_order_id', 'lab_test_id', 'name', 'category', 'price', 'account_charge_id'];

    protected function casts(): array
    {
        return ['price' => 'integer'];
    }

    /** @return BelongsTo<LabTest, $this> */
    public function test(): BelongsTo
    {
        return $this->belongsTo(LabTest::class, 'lab_test_id');
    }

    /** @return HasMany<LabResult, $this> */
    public function results(): HasMany
    {
        return $this->hasMany(LabResult::class)->orderBy('position');
    }
}
