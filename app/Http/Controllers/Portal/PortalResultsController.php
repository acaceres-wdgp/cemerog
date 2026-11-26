<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\ImagingOrder;
use App\Models\LabOrderItem;
use App\Models\ResultAccessCode;
use App\Models\ResultAccessLog;
use App\Support\Clinic;
use App\Support\PortalStudies;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Results portal › the studies of the code in session: the list, the viewer
 * and the downloads. Every access is logged; files are only served from
 * here, never from a public URL.
 */
class PortalResultsController extends Controller
{
    public function index(Request $request): Response
    {
        $code = $this->code($request);
        $studies = (new PortalStudies($code))->summaries();

        return Inertia::render('portal/resultados', [
            'patient' => $this->patient($code),
            'studies' => $studies,
            'clinic' => Clinic::info(),
        ]);
    }

    public function show(Request $request, string $item): Response
    {
        $code = $this->code($request);
        $study = (new PortalStudies($code))->findReady($item);
        ResultAccessLog::record($request, 'view', $code->id, ['study' => $item]);

        return Inertia::render('portal/estudio', [
            'patient' => $this->patient($code),
            'study' => PortalStudies::detail($study),
            'clinic' => Clinic::info(),
        ]);
    }

    public function pdf(Request $request, string $item): HttpResponse
    {
        $code = $this->code($request);
        $study = (new PortalStudies($code))->findReady($item);
        ResultAccessLog::record($request, 'download_pdf', $code->id, ['study' => $item]);

        return $this->download($code, [$study], 'resultado-'.$this->slug($study).'.pdf');
    }

    public function all(Request $request): HttpResponse
    {
        $code = $this->code($request);
        $studies = (new PortalStudies($code))->allReady();
        abort_if($studies === [], 404);
        ResultAccessLog::record($request, 'download_all', $code->id, ['count' => count($studies)]);

        return $this->download($code, $studies, 'resultados.pdf');
    }

    public function image(Request $request, string $item, int $n): StreamedResponse
    {
        $code = $this->code($request);
        $study = (new PortalStudies($code))->findReady($item);
        abort_unless($study instanceof ImagingOrder, 404);
        $image = PortalStudies::images($study)->get($n - 1);
        abort_if($image === null || ! Storage::disk('local')->exists($image->path), 404);
        ResultAccessLog::record($request, 'download_image', $code->id, ['study' => $item, 'image' => $n]);

        return Storage::disk('local')->download($image->path, $image->original_name, [
            'Cache-Control' => 'no-store, private, max-age=0',
            'X-Robots-Tag' => 'noindex, nofollow',
        ]);
    }

    /** @param  list<LabOrderItem|ImagingOrder>  $studies */
    private function download(ResultAccessCode $code, array $studies, string $filename): HttpResponse
    {
        $details = array_map(fn ($study) => [
            ...PortalStudies::detail($study),
            'embedded' => $study instanceof ImagingOrder ? $this->embeddedImages($study) : [],
        ], $studies);

        return Pdf::loadView('portal.results-pdf', [
            'patient' => $this->patient($code),
            'studies' => $details,
            'clinic' => Clinic::info(),
        ])->setPaper('letter')->download($filename);
    }

    /**
     * JPG and PNG images as data URIs for the PDF (dompdf reads no URLs).
     *
     * @return list<array{name: string, src: string}>
     */
    private function embeddedImages(ImagingOrder $order): array
    {
        return PortalStudies::images($order)
            ->filter(fn ($a) => in_array($a->mime, ['image/jpeg', 'image/png'], true) && Storage::disk('local')->exists($a->path))
            ->map(fn ($a) => [
                'name' => $a->original_name,
                'src' => 'data:'.$a->mime.';base64,'.base64_encode((string) Storage::disk('local')->get($a->path)),
            ])
            ->values()
            ->all();
    }

    private function code(Request $request): ResultAccessCode
    {
        /** @var ResultAccessCode $code */
        $code = $request->attributes->get('portal_code');

        return $code;
    }

    /** @return array<string, mixed> */
    private function patient(ResultAccessCode $code): array
    {
        $code->loadMissing(['patient', 'account', 'invoice']);
        $patient = $code->patient;
        $sex = ['F' => 'F', 'M' => 'M'][$patient->sex] ?? null;

        return [
            'name' => $patient->full_name,
            'age_sex' => trim(($patient->age !== null ? $patient->age.' años' : '').($sex ? ' · '.$sex : ''), ' ·'),
            'service_date' => $code->account->service_date->format('d/m/Y'),
            'invoice' => $code->invoice?->number,
            'expires_on' => $code->expires_at->format('d/m/Y'),
        ];
    }

    private function slug(LabOrderItem|ImagingOrder $study): string
    {
        return str($study->name)->slug()->value();
    }
}
