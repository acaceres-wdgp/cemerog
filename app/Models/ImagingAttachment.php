<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An image or PDF of an imaging study (private disk «local»).
 *
 * @property int $id
 * @property int $imaging_order_id
 * @property string $path
 * @property string $original_name
 * @property string|null $mime
 * @property int $size bytes
 * @property int $uploaded_by
 * @property-read ImagingOrder $order
 */
class ImagingAttachment extends Model
{
    protected $fillable = ['imaging_order_id', 'path', 'original_name', 'mime', 'size', 'uploaded_by'];

    protected function casts(): array
    {
        return ['size' => 'integer'];
    }

    /** @return BelongsTo<ImagingOrder, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(ImagingOrder::class, 'imaging_order_id');
    }
}
