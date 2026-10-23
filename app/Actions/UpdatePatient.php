<?php

namespace App\Actions;

use App\Models\Patient;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class UpdatePatient
{
    public function handle(Patient $patient, array $data): Patient
    {
        $file = Arr::pull($data, 'photo');
        $removePhoto = Arr::pull($data, 'remove_photo', false);

        if ($removePhoto && $patient->photo_path) {
            Storage::disk('public')->delete($patient->photo_path);
            $data['photo_path'] = null;
        } elseif ($file instanceof UploadedFile) {
            if ($patient->photo_path) {
                Storage::disk('public')->delete($patient->photo_path);
            }
            $data['photo_path'] = $file->store('patients/photos', 'public');
        }

        $patient->update($data);

        return $patient->fresh();
    }
}
