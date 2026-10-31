<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Spatie\Permission\Traits\HasRoles;

/**
 * @property int $id
 * @property string $name
 * @property string $username
 * @property string|null $email
 * @property string $password
 * @property bool $is_active
 * @property bool $must_change_password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Doctor|null $doctor
 */
#[Fillable(['name', 'username', 'email', 'password', 'is_active', 'must_change_password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /** @return HasOne<Doctor, $this> */
    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    /**
     * Returns true when the user has a linked doctor that is currently active.
     * Used by AttendPatients middleware, ConsultaController, and HandleInertiaRequests.
     */
    public function canAttendPatients(): bool
    {
        return $this->doctor !== null && $this->doctor->is_active;
    }

    /**
     * Returns true when the user is a non-admin doctor who should only see and
     * manage their own turns and appointments.
     * Admins (even those with a linked doctor), secretaries, and other roles see everything.
     */
    public function seesOnlyOwnSchedule(): bool
    {
        return $this->doctor !== null
            && $this->doctor->is_active
            && ! $this->hasRole('administrador');
    }
}
