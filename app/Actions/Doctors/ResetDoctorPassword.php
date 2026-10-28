<?php

namespace App\Actions\Doctors;

use App\Models\Doctor;

/**
 * Generates a new temporary password for the doctor's linked user.
 *
 * @return array{name: string, username: string, password: string}
 */
class ResetDoctorPassword
{
    public function __construct(
        private readonly GenerateDoctorCredentials $generateCredentials,
    ) {}

    /**
     * @return array{name: string, username: string, password: string}
     */
    public function handle(Doctor $doctor): array
    {
        $user = $doctor->user;

        if ($user === null) {
            throw new \RuntimeException('El doctor no tiene un usuario vinculado.');
        }

        $plainPassword = $this->generateCredentials->generatePassword();

        $user->update([
            'password' => $plainPassword,
            'must_change_password' => true,
        ]);

        return [
            'name' => $doctor->name,
            'username' => $user->username,
            'password' => $plainPassword,
        ];
    }
}
