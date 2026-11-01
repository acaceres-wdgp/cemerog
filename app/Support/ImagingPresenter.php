<?php

namespace App\Support;

use App\Models\ImagingStudy;

/** Imaging data for the pages */
class ImagingPresenter
{
    /**
     * Active studies to order, by modality and name.
     *
     * @return list<array{id: int, code: string, name: string, modality: string, price: int, preparation: string|null}>
     */
    public function catalog(): array
    {
        $order = array_flip(ImagingStudy::MODALITIES);

        return ImagingStudy::where('is_active', true)->orderBy('code')->get()
            ->sortBy(fn (ImagingStudy $s): int => $order[$s->modality] ?? 99)
            ->map(fn (ImagingStudy $s): array => [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
                'modality' => $s->modality,
                'price' => $s->price,
                'preparation' => $s->preparation,
            ])
            ->values()
            ->all();
    }
}
