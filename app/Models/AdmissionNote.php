<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A nursing note of an admission.
 *
 * @property int $id
 * @property int $admission_id
 * @property string $body
 * @property string $shift mañana | tarde | noche
 * @property int $created_by
 * @property Carbon $created_at
 * @property-read User $author
 */
class AdmissionNote extends Model
{
    protected $fillable = ['admission_id', 'body', 'shift', 'created_by'];

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Mañana 07–15, tarde 15–23, noche 23–07 */
    public static function shiftAt(Carbon $at): string
    {
        $h = $at->hour;

        return match (true) {
            $h >= 7 && $h < 15 => 'mañana',
            $h >= 15 && $h < 23 => 'tarde',
            default => 'noche',
        };
    }
}
