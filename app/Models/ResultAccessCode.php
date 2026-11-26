<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A code of the results portal, tied to the patient's account (atención).
 *
 * @property int $id
 * @property int $account_id
 * @property int $patient_id
 * @property int|null $invoice_id
 * @property string $code_hash
 * @property string $code_encrypted Decrypted on read (only to reprint it)
 * @property Carbon $expires_at
 * @property Carbon|null $revoked_at
 * @property Carbon|null $last_used_at
 * @property int $created_by
 */
class ResultAccessCode extends Model
{
    /** Days a code works since it is generated */
    public const VALID_DAYS = 90;

    protected $fillable = [
        'account_id',
        'patient_id',
        'invoice_id',
        'code_hash',
        'code_encrypted',
        'expires_at',
        'revoked_at',
        'last_used_at',
        'created_by',
    ];

    protected $hidden = ['code_hash', 'code_encrypted'];

    protected function casts(): array
    {
        return [
            'code_encrypted' => 'encrypted',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'last_used_at' => 'datetime',
        ];
    }

    /** sha256 of the normalized code and the app key: what is stored and searched */
    public static function hashCode(string $normalized): string
    {
        return hash('sha256', $normalized.config('app.key'));
    }

    public function isUsable(): bool
    {
        return $this->revoked_at === null && $this->expires_at->isFuture();
    }

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class)->withTrashed();
    }

    /** @return BelongsTo<Invoice, $this> */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /** @return HasMany<ResultAccessLog, $this> */
    public function logs(): HasMany
    {
        return $this->hasMany(ResultAccessLog::class);
    }
}
