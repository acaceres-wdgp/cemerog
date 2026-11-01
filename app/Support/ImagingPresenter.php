<?php

namespace App\Support;

use App\Models\ImagingAttachment;
use App\Models\ImagingOrder;
use App\Models\ImagingStudy;
use App\Models\Patient;
use App\Models\StudyCategory;

/** Imaging data for the pages */
class ImagingPresenter
{
    public const ORIGINS = LabPresenter::ORIGINS;

    /**
     * Active studies to order, by modality and name.
     *
     * @return list<array{id: int, code: string, name: string, modality: string, price: int, preparation: string|null}>
     */
    public function catalog(): array
    {
        $order = array_flip(StudyCategory::names('imagen'));

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

    /**
     * An order as listed in the queue, the patient view and Consulta.
     *
     * @return array<string, mixed>
     */
    public function summary(ImagingOrder $order): array
    {
        $order->loadMissing(['doctor', 'attachments']);

        return [
            'id' => $order->id,
            'number' => $order->number,
            'name' => $order->name,
            'modality' => $order->modality,
            'status' => $order->status,
            'price' => $order->price,
            'ordered_at' => $order->ordered_at->format('d/m/Y H:i'),
            'ordered_date' => $order->ordered_at->format('d/m/Y'),
            'ordered_time' => $order->ordered_at->format('H:i'),
            'origin' => self::ORIGINS[$order->origin] ?? $order->origin,
            'doctor' => $order->doctor_id !== null ? $order->doctor->name : $order->external_doctor,
            'indication' => $order->indication,
            'cancel_reason' => $order->cancel_reason,
            'files_count' => $order->attachments->count(),
        ];
    }

    /**
     * A row of the queue, with the patient.
     *
     * @return array<string, mixed>
     */
    public function row(ImagingOrder $order): array
    {
        $order->loadMissing('patient');

        return [...$this->summary($order), 'patient' => $this->patient($order->patient)];
    }

    /**
     * The order with its report and attachments.
     *
     * @return array<string, mixed>
     */
    public function detail(ImagingOrder $order): array
    {
        $order->loadMissing(['signer', 'attachments']);

        return [
            ...$this->summary($order),
            'findings' => $order->findings,
            'conclusion' => $order->conclusion,
            'performed_at' => $order->performed_at?->format('d/m/Y H:i'),
            'signed_at' => $order->signed_at?->format('d/m/Y H:i'),
            'signed_by' => $order->signer?->name,
            'editable' => $order->isReportEditable(),
            'attachments' => $order->attachments->map(fn (ImagingAttachment $a): array => [
                'id' => $a->id,
                'name' => $a->original_name,
                'size' => $a->size,
                'is_image' => str_starts_with((string) $a->mime, 'image/'),
            ])->all(),
        ];
    }

    /**
     * Summary plus the signed report, for Consulta and Emergencia.
     *
     * @return array<string, mixed>
     */
    public function withReport(ImagingOrder $order): array
    {
        return [...$this->summary($order), 'report' => $this->report($order)];
    }

    /**
     * The signed report with its files, or null while it is not signed.
     *
     * @return array{number: string|null, name: string, findings: string|null, conclusion: string|null, signed_at: string|null, signed_by: string|null, attachments: list<array{id: int, name: string, is_image: bool}>}|null
     */
    public function report(ImagingOrder $order): ?array
    {
        if (! in_array($order->status, ['listo', 'entregado'], true)) {
            return null;
        }
        $order->loadMissing(['signer', 'attachments']);

        return [
            'number' => $order->number,
            'name' => $order->name,
            'findings' => $order->findings,
            'conclusion' => $order->conclusion,
            'signed_at' => $order->signed_at?->format('d/m/Y H:i'),
            'signed_by' => $order->signer?->name,
            'attachments' => $order->attachments->map(fn (ImagingAttachment $a): array => [
                'id' => $a->id,
                'name' => $a->original_name,
                'is_image' => str_starts_with((string) $a->mime, 'image/'),
            ])->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function patient(Patient $p): array
    {
        return [
            'id' => $p->id,
            'full_name' => $p->full_name,
            'age' => $p->age,
            'sex' => $p->sex,
            'document_number' => $p->document_type === 'no_tiene' ? null : $p->document_number,
        ];
    }
}
