<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Img\ManageImagingAttachments;
use App\Actions\Img\PerformImagingStudy;
use App\Actions\Img\SaveImagingReport;
use App\Actions\Patients\SearchPatients;
use App\Http\Controllers\Controller;
use App\Models\ImagingAttachment;
use App\Models\ImagingOrder;
use App\Models\User;
use App\Support\ImagingPresenter;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Imágenes: studies, report with attachments, signature and delivery */
class ImgController extends Controller
{
    /** Who signs the reports */
    public const SIGNER_ROLES = ['imagenes', 'administrador'];

    public function index(Request $request, ImagingPresenter $img): Response
    {
        $q = trim($request->string('q')->toString());
        $range = $request->string('rango', '30')->toString();
        $status = $request->string('estado', 'todos')->toString();

        $base = ImagingOrder::query()
            ->when(in_array($range, ['7', '30'], true), fn (Builder $b) => $b->where(
                fn (Builder $w) => $w->where('ordered_at', '>=', now()->subDays((int) $range)->startOfDay())
                    ->orWhereIn('status', ['ordenada', 'realizado', 'borrador'])
            ))
            ->when($q !== '', function (Builder $b) use ($q): void {
                $b->where(fn (Builder $w) => $w->where('number', 'like', "%{$q}%")
                    ->orWhere('name', 'like', "%{$q}%")
                    ->orWhereHas('patient', fn (Builder $p) => app(SearchPatients::class)->applyTo($p, $q)));
            });

        $counts = (clone $base)->selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status');
        $page = (clone $base)->with(['patient', 'doctor', 'attachments'])
            ->when($status !== 'todos', fn (Builder $b) => $b->where('status', $status))
            // Pending work first, then the most recent
            ->orderByRaw("case when status in ('ordenada', 'realizado', 'borrador') then 0 else 1 end")
            ->orderByDesc('ordered_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('img/index', [
            'orders' => collect($page->items())->map(fn (ImagingOrder $o): array => $img->row($o))->all(),
            'pagination' => ['current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total(), 'from' => $page->firstItem(), 'to' => $page->lastItem()],
            'counts' => collect(ImagingOrder::STATUSES)->mapWithKeys(fn (string $s): array => [$s => (int) ($counts[$s] ?? 0)])->all(),
            'pending' => ImagingOrder::whereIn('status', ['ordenada', 'realizado', 'borrador'])->count(),
            'filters' => ['q' => $q, 'rango' => $range, 'estado' => $status],
        ]);
    }

    /** Patient view: every study of the patient and the selected one */
    public function show(Request $request, ImagingOrder $order, ImagingPresenter $img): Response
    {
        $studies = ImagingOrder::with(['doctor', 'attachments'])
            ->where('patient_id', $order->patient_id)
            ->orderByDesc('ordered_at')
            ->get();

        return Inertia::render('img/show', [
            'patient' => $img->patient($order->patient),
            'studies' => $studies->map(fn (ImagingOrder $o): array => $img->summary($o))->all(),
            'order' => $img->detail($order),
            'can_sign' => $this->canSign($request->user()),
        ]);
    }

    public function perform(Request $request, ImagingOrder $order, PerformImagingStudy $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $action->handle($order, $user);

        Toast::success("{$order->name} de {$order->patient->full_name} registrado como realizado.");

        return back();
    }

    public function saveReport(Request $request, ImagingOrder $order, SaveImagingReport $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        [$findings, $conclusion] = $this->report($request);
        $action->handle($order, $findings, $conclusion, $user);

        Toast::success('Borrador del informe guardado.');

        return back();
    }

    public function sign(Request $request, ImagingOrder $order, SaveImagingReport $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->canSign($user), 403);
        [$findings, $conclusion] = $this->report($request);
        $action->handle($order, $findings, $conclusion, $user, sign: true);

        $to = $order->doctor_id !== null ? " Enviado a {$order->doctor->name}." : '';
        Toast::success("Informe {$order->number} firmado.{$to}");

        return back();
    }

    public function deliver(ImagingOrder $order): RedirectResponse
    {
        if ($order->status !== 'listo') {
            return back()->withErrors(['order' => 'Solo se entrega un informe firmado.']);
        }
        $order->update(['status' => 'entregado', 'delivered_at' => now()]);

        Toast::success("Estudio {$order->number} entregado a {$order->patient->full_name}.");

        return back();
    }

    public function print(ImagingOrder $order, ImagingPresenter $img): Response
    {
        return Inertia::render('img/imprimir', [
            'patient' => $img->patient($order->patient),
            'order' => $img->detail($order),
            'clinic' => ['name' => config('cemerog.clinic.name'), 'phone' => config('cemerog.clinic.phone'), 'address' => config('cemerog.clinic.address')],
        ]);
    }

    public function upload(Request $request, ImagingOrder $order, ManageImagingAttachments $action): RedirectResponse
    {
        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['file', 'max:20480', 'extensions:jpg,jpeg,png,webp,pdf,dcm'],
        ], ['files.*.extensions' => 'Solo imágenes, PDF o DICOM (.dcm).', 'files.*.max' => 'Cada archivo puede pesar hasta 20 MB.']);

        /** @var User $user */
        $user = $request->user();
        $n = $action->add($order, array_values((array) $request->file('files')), $user);

        Toast::success($n === 1 ? 'Archivo adjuntado.' : "{$n} archivos adjuntados.");

        return back();
    }

    public function removeAttachment(ImagingAttachment $attachment, ManageImagingAttachments $action): RedirectResponse
    {
        $action->remove($attachment);

        Toast::success('Archivo quitado.');

        return back();
    }

    /** Served through the app: the files are on the private disk */
    public function download(Request $request, ImagingAttachment $attachment): StreamedResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->can('module.img.access') || $user->can('module.consulta.access') || $user->can('module.emergencia.access'), 403);
        abort_unless(Storage::disk(ManageImagingAttachments::DISK)->exists($attachment->path), 404);

        return Storage::disk(ManageImagingAttachments::DISK)->response($attachment->path, $attachment->original_name);
    }

    /** An order not performed yet is cancelled (e.g. the patient does it elsewhere) */
    public function cancel(Request $request, ImagingOrder $order): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->can('module.img.access') || $user->can('module.consulta.access') || $user->can('module.emergencia.access'), 403);
        $reason = (string) $request->validate(
            ['reason' => ['required', 'string', 'max:255']],
            ['reason.required' => 'Indica por qué se cancela.'],
        )['reason'];

        if ($order->status !== 'ordenada') {
            return back()->withErrors(['order' => 'Solo se cancela un estudio que no se ha realizado.']);
        }
        $order->update(['status' => 'cancelada', 'cancelled_at' => now(), 'cancelled_by' => $user->id, 'cancel_reason' => trim($reason)]);

        Toast::success("Orden {$order->number} cancelada.");

        return back();
    }

    private function canSign(?User $user): bool
    {
        return $user !== null && $user->hasAnyRole(self::SIGNER_ROLES);
    }

    /** @return array{0: string|null, 1: string|null} */
    private function report(Request $request): array
    {
        $data = $request->validate([
            'findings' => ['nullable', 'string', 'max:10000'],
            'conclusion' => ['nullable', 'string', 'max:2000'],
        ]);

        return [$data['findings'] ?? null, $data['conclusion'] ?? null];
    }
}
