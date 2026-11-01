<?php

namespace App\Actions\Img;

use App\Models\ImagingAttachment;
use App\Models\ImagingOrder;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Images and PDFs of a study. They are clinical data, so they live on the
 * private disk and are only served through the application. They can be
 * added or removed while the report is not signed.
 */
class ManageImagingAttachments
{
    public const DISK = 'local';

    /** @param list<UploadedFile> $files */
    public function add(ImagingOrder $order, array $files, User $user): int
    {
        $this->ensureEditable($order);

        foreach ($files as $file) {
            $order->attachments()->create([
                'path' => $file->store("imaging/{$order->id}", self::DISK),
                'original_name' => mb_substr($file->getClientOriginalName(), 0, 255),
                'mime' => $file->getMimeType(),
                'size' => (int) $file->getSize(),
                'uploaded_by' => $user->id,
            ]);
        }

        return count($files);
    }

    public function remove(ImagingAttachment $attachment): void
    {
        $this->ensureEditable($attachment->order);

        Storage::disk(self::DISK)->delete($attachment->path);
        $attachment->delete();
    }

    private function ensureEditable(ImagingOrder $order): void
    {
        if (! $order->isReportEditable()) {
            throw ValidationException::withMessages(['files' => $order->status === 'ordenada'
                ? 'Registra primero que el estudio fue realizado.'
                : 'El informe ya fue firmado; sus archivos no se modifican.']);
        }
    }
}
