<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property int $account_id
 * @property int|null $turn_id
 * @property int|null $doctor_id
 * @property int $created_by
 * @property string $type
 * @property string $description
 * @property int $quantity
 * @property int $unit_price
 * @property int $total
 * @property int|null $doctor_fee
 * @property string|null $source_type
 * @property int|null $source_id
 * @property-read Account $account
 * @property-read Turn|null $turn
 * @property-read Doctor|null $doctor
 * @property-read User $createdBy
 */
class AccountCharge extends Model
{
    protected $fillable = [
        'account_id',
        'turn_id',
        'doctor_id',
        'created_by',
        'type',
        'description',
        'quantity',
        'unit_price',
        'total',
        'doctor_fee',
        'source_type',
        'source_id',
    ];

    /** @return BelongsTo<Account, $this> */
    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** @return BelongsTo<Turn, $this> */
    public function turn(): BelongsTo
    {
        return $this->belongsTo(Turn::class);
    }

    /** @return BelongsTo<Doctor, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /** @return BelongsTo<User, $this> */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return MorphTo<Model, $this> */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}
