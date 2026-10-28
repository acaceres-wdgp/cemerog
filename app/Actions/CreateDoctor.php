<?php

namespace App\Actions;

use App\Actions\Doctors\GenerateDoctorCredentials;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateDoctor
{
    public function __construct(
        private readonly GenerateDoctorCredentials $generateCredentials,
    ) {}

    /**
     * Create a doctor, optionally creating or linking a user.
     *
     * @param  array<string, mixed>  $data
     * @return array{doctor: Doctor, credentials: array{name: string, username: string, password: string}|null}
     */
    public function handle(array $data): array
    {
        $accessMode = $data['access_mode'] ?? 'none';
        $plainPassword = null;
        $linkedUser = null;

        return DB::transaction(function () use ($data, $accessMode, &$plainPassword, &$linkedUser) {
            if ($accessMode === 'create_user') {
                $result = $this->generateCredentials->handle($data['name']);
                $linkedUser = $result['user'];
                $plainPassword = $result['plainPassword'];
            } elseif (($accessMode === 'link_user' || ($accessMode === 'none' && isset($data['user_id']))) && isset($data['user_id'])) {
                /** @var User $linkedUser */
                $linkedUser = User::findOrFail($data['user_id']);
                if (! $linkedUser->hasRole('medico')) {
                    $linkedUser->assignRole('medico');
                }
            }

            $doctor = Doctor::create([
                'name' => $data['name'],
                'exequatur' => $data['exequatur'] ?? null,
                'phone' => $data['phone'] ?? null,
                'specialty_id' => $data['specialty_id'],
                'office' => $data['office'] ?? null,
                'user_id' => $linkedUser?->id,
                'is_active' => true,
            ]);

            $credentials = null;
            if ($plainPassword !== null && $linkedUser !== null) {
                $credentials = [
                    'name' => $doctor->name,
                    'username' => $linkedUser->username,
                    'password' => $plainPassword,
                ];
            }

            return ['doctor' => $doctor, 'credentials' => $credentials];
        });
    }
}
