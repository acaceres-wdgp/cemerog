<?php

namespace App\Support;

use App\Models\ImagingAttachment;
use App\Models\ImagingOrder;
use App\Models\LabOrderItem;
use App\Models\LabResult;
use App\Models\LabTestParameter;
use App\Models\ResultAccessCode;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

/**
 * The studies a results code gives access to: the lab tests and imaging
 * studies charged to its account (atención). A study is «ready» once it is
 * final in its module (lab validated or delivered; imaging report signed or
 * delivered); until then the portal shows no clinical data of it.
 *
 * This is also the ownership check of the portal: a study that is not of
 * the code's account is not found (404), never forbidden.
 */
class PortalStudies
{
    public const LAB_READY = ['validada', 'entregada'];

    public const IMG_READY = ['listo', 'entregado'];

    /** Images the portal shows and serves (DICOM and PDF stay in the clinic) */
    public const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

    public function __construct(private ResultAccessCode $code) {}

    /** @return Collection<int, LabOrderItem> */
    public function labItems(): Collection
    {
        return LabOrderItem::with(['order.validator', 'order.doctor', 'results.parameter'])
            ->whereIn('account_charge_id', $this->chargeIds())
            ->whereHas('order', fn ($q) => $q->where('status', '!=', 'cancelada'))
            ->orderBy('id')
            ->get();
    }

    /** @return Collection<int, ImagingOrder> */
    public function imagingOrders(): Collection
    {
        return ImagingOrder::with(['signer', 'doctor', 'attachments'])
            ->whereIn('account_charge_id', $this->chargeIds())
            ->where('status', '!=', 'cancelada')
            ->orderBy('id')
            ->get();
    }

    /**
     * The list of the portal: every study, ready or not.
     *
     * @return list<array<string, mixed>>
     */
    public function summaries(): array
    {
        $lab = $this->labItems()->map(fn (LabOrderItem $i): array => [
            'key' => "lab-{$i->id}",
            'kind' => 'lab',
            'name' => $i->name,
            'ready' => self::labReady($i),
            'detail' => self::labReady($i)
                ? 'Validado el '.self::when($i->order->validated_at)
                : 'Aún en el laboratorio. Estará aquí cuando se valide.',
        ]);
        $img = $this->imagingOrders()->map(fn (ImagingOrder $o): array => [
            'key' => "img-{$o->id}",
            'kind' => 'img',
            'name' => $o->name,
            'ready' => self::imgReady($o),
            'detail' => self::imgReady($o)
                ? 'Informe firmado el '.self::when($o->signed_at).self::imagesLabel($o)
                : ($o->status === 'ordenada'
                    ? 'Pendiente de realizar el estudio.'
                    : 'Estudio realizado. Pendiente del informe del radiólogo.'),
        ]);

        return [...$lab->values()->all(), ...$img->values()->all()];
    }

    /**
     * A ready study of this code, by its key («lab-12», «img-5»); 404 if it
     * is not of the account or not ready.
     */
    public function findReady(string $key): LabOrderItem|ImagingOrder
    {
        [$kind, $id] = explode('-', $key, 2) + [null, null];
        $study = match ($kind) {
            'lab' => $this->labItems()->firstWhere('id', (int) $id),
            'img' => $this->imagingOrders()->firstWhere('id', (int) $id),
            default => null,
        };
        $ready = match (true) {
            $study instanceof LabOrderItem => self::labReady($study),
            $study instanceof ImagingOrder => self::imgReady($study),
            default => false,
        };
        abort_unless($ready, 404);

        return $study;
    }

    /** @return list<LabOrderItem|ImagingOrder> */
    public function allReady(): array
    {
        return [
            ...$this->labItems()->filter(fn (LabOrderItem $i) => self::labReady($i))->values()->all(),
            ...$this->imagingOrders()->filter(fn (ImagingOrder $o) => self::imgReady($o))->values()->all(),
        ];
    }

    /**
     * What the viewer and the PDF show of a ready study.
     *
     * @return array<string, mixed>
     */
    public static function detail(LabOrderItem|ImagingOrder $study): array
    {
        if ($study instanceof LabOrderItem) {
            $order = $study->order;

            return [
                'key' => "lab-{$study->id}",
                'kind' => 'lab',
                'name' => $study->name,
                'department' => 'Laboratorio clínico',
                'taken' => self::when($order->sample_at, ' · '),
                'taken_label' => 'Toma de muestra',
                'doctor' => $order->doctor_id !== null ? $order->doctor->name : $order->external_doctor,
                'validated_by' => $order->validator?->name,
                'validated_at' => self::when($order->validated_at, ' '),
                'verification' => "{$order->number}-{$study->id}",
                'rows' => $study->results->map(fn (LabResult $r): array => self::labRow($r))->values()->all(),
            ];
        }

        return [
            'key' => "img-{$study->id}",
            'kind' => 'img',
            'name' => $study->name,
            'department' => 'Departamento de imágenes',
            'taken' => self::when($study->performed_at, ' · '),
            'taken_label' => 'Realizado',
            'doctor' => $study->doctor_id !== null ? $study->doctor->name : $study->external_doctor,
            'validated_by' => $study->signer?->name,
            'validated_at' => self::when($study->signed_at, ' '),
            'verification' => (string) $study->number,
            'findings' => $study->findings,
            'conclusion' => $study->conclusion,
            'images' => self::images($study)->values()->map(fn (ImagingAttachment $a, int $n): array => [
                'n' => $n + 1,
                'name' => $a->original_name,
            ])->all(),
        ];
    }

    /** @return Collection<int, ImagingAttachment> */
    public static function images(ImagingOrder $order): Collection
    {
        return $order->attachments->filter(fn (ImagingAttachment $a) => in_array($a->mime, self::IMAGE_MIMES, true))->values();
    }

    /**
     * A result with its flag: «A» above or «B» below the reference range of
     * the catalog; «*» for a text result that is not the normal one.
     *
     * @return array{test: string, value: string, unit: string, reference: string, flag: string}
     */
    private static function labRow(LabResult $result): array
    {
        $parameter = $result->lab_test_parameter_id !== null ? $result->parameter : null;
        $value = (string) $result->value;
        $flag = '';
        if ($result->out_of_range) {
            $number = (float) str_replace(',', '.', $value);
            $flag = match (true) {
                $parameter === null || $parameter->result_type === 'texto' => '*',
                $parameter->max !== null && $number > (float) $parameter->max => 'A',
                $parameter->min !== null && $number < (float) $parameter->min => 'B',
                default => '*',
            };
        }

        return [
            'test' => $result->name,
            'value' => $value,
            'unit' => (string) $parameter?->unit,
            'reference' => $parameter !== null ? self::range($parameter) : $result->reference,
            'flag' => $flag,
        ];
    }

    /** «4.5 – 11», «Hasta 5», «Claro»: the range without the unit */
    private static function range(LabTestParameter $parameter): string
    {
        $text = $parameter->referenceText();
        $unit = (string) $parameter->unit;

        return $unit !== '' && str_ends_with($text, ' '.$unit) ? substr($text, 0, -strlen(' '.$unit)) : $text;
    }

    private static function labReady(LabOrderItem $item): bool
    {
        return in_array($item->order->status, self::LAB_READY, true);
    }

    private static function imgReady(ImagingOrder $order): bool
    {
        return in_array($order->status, self::IMG_READY, true);
    }

    private static function imagesLabel(ImagingOrder $order): string
    {
        $n = self::images($order)->count();

        return $n === 0 ? '' : ' · '.$n.($n === 1 ? ' imagen' : ' imágenes');
    }

    /** 12/10/2026 a las 11:20 AM, in the clinic's time zone */
    private static function when(?CarbonInterface $moment, string $separator = ' a las '): string
    {
        return $moment === null ? '—' : (string) ClinicTime::dateTime($moment, $separator);
    }

    /** @return Collection<int, int> */
    private function chargeIds(): Collection
    {
        return $this->code->account->charges()->pluck('id');
    }
}
