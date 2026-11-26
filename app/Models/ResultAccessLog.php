<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Http\Request;
use LogicException;

/**
 * Log of access to health data in the results portal. Append-only: it is
 * never updated or deleted.
 *
 * @property int $id
 * @property int|null $result_access_code_id
 * @property string|null $ip
 * @property string|null $user_agent
 * @property string $event
 * @property array<string, mixed>|null $meta
 */
class ResultAccessLog extends Model
{
    public const UPDATED_AT = null;

    public const EVENTS = ['login_ok', 'login_fail', 'locked', 'view', 'download_pdf', 'download_image', 'download_all'];

    protected $fillable = ['result_access_code_id', 'ip', 'user_agent', 'event', 'meta'];

    protected function casts(): array
    {
        return ['meta' => 'array', 'created_at' => 'datetime'];
    }

    /** @param  array<string, mixed>  $meta */
    public static function record(Request $request, string $event, ?int $codeId = null, array $meta = []): self
    {
        return self::create([
            'result_access_code_id' => $codeId,
            'ip' => $request->ip(),
            'user_agent' => mb_substr((string) $request->userAgent(), 0, 255),
            'event' => $event,
            'meta' => $meta === [] ? null : $meta,
        ]);
    }

    public function delete(): ?bool
    {
        throw new LogicException('The results access log is never deleted.');
    }

    /** @return BelongsTo<ResultAccessCode, $this> */
    public function code(): BelongsTo
    {
        return $this->belongsTo(ResultAccessCode::class, 'result_access_code_id');
    }
}
