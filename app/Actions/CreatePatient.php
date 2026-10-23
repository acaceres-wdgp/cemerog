<?php

namespace App\Actions;

use App\Models\Patient;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class CreatePatient
{
    public function handle(array $data): Patient
    {
        if ($data['document_type'] === 'no_tiene') {
            do {
                $generated = 'GEN-' . strtoupper(Str::random(8));
                $hash = hash_hmac('sha256', $generated, config('app.key'));
            } while (Patient::where('document_number_hash', $hash)->exists());

            $data['document_number'] = $generated;
        }

        $file = Arr::pull($data, 'photo');
        if ($file instanceof UploadedFile) {
            $data['photo_path'] = $file->store('patients/photos', 'public');
        }

        return Patient::create($data);
    }
}
