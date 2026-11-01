<?php

namespace App\Http\Controllers\Modules;

use App\Actions\Lab\SaveLabResults;
use App\Actions\Lab\TakeLabSample;
use App\Actions\Patients\SearchPatients;
use App\Http\Controllers\Controller;
use App\Models\LabOrder;
use App\Models\LabTest;
use App\Models\User;
use App\Support\LabPresenter;
use App\Support\Toast;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Laboratorio: queue, results, validation and delivery */
class LabController extends Controller
{
    /** Who validates the results */
    public const VALIDATOR_ROLES = ['bioanalista', 'administrador'];

    public function index(Request $request, LabPresenter $lab): Response
    {
        $view = $request->string('vista')->toString() === 'historial' ? 'historial' : 'hoy';

        // Today: everything ordered today and anything still in progress
        $today = LabOrder::with(['patient', 'doctor', 'items.results'])
            ->where(fn (Builder $q) => $q->whereDate('ordered_at', today())
                ->orWhereIn('status', ['ordenada', 'muestra', 'ingresado', 'validada']))
            ->orderBy('ordered_at')
            ->get();

        return Inertia::render('lab/index', [
            'view' => $view,
            'orders' => $today->map(fn (LabOrder $o): array => $lab->row($o))->values()->all(),
            'counts' => collect(LabOrder::STATUSES)->mapWithKeys(fn (string $s): array => [$s => $today->where('status', $s)->count()])->all(),
            'history' => $view === 'historial' ? $this->history($request, $lab) : null,
            'tests' => LabTest::orderBy('name')->get(['id', 'name'])->toArray(),
            'filters' => [
                'q' => $request->string('q')->toString(),
                'prueba' => $request->integer('prueba') ?: null,
                'rango' => $request->string('rango', '30')->toString(),
            ],
        ]);
    }

    public function show(Request $request, LabOrder $order, LabPresenter $lab): Response
    {
        return Inertia::render('lab/show', [
            'order' => $lab->detail($order, $this->canValidate($request->user())),
        ]);
    }

    public function sample(Request $request, LabOrder $order, TakeLabSample $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $action->handle($order, $user);

        Toast::success("Muestra de {$order->patient->full_name} registrada ({$order->number}).");

        return back();
    }

    public function saveResults(Request $request, LabOrder $order, SaveLabResults $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $action->handle($order, $this->values($request), $user);

        Toast::success("Resultados de {$order->number} guardados.");

        return back();
    }

    public function validateResults(Request $request, LabOrder $order, SaveLabResults $action): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->canValidate($user), 403);
        $action->handle($order, $this->values($request), $user, validate: true);

        Toast::success("Resultados de {$order->number} validados.");

        return back();
    }

    public function deliver(LabOrder $order): RedirectResponse
    {
        if ($order->status !== 'validada') {
            return back()->withErrors(['order' => 'Solo se entrega un resultado validado.']);
        }
        $order->update(['status' => 'entregada', 'delivered_at' => now()]);

        Toast::success("Resultado {$order->number} entregado a {$order->patient->full_name}.");

        return back();
    }

    /** Indication before the results, results after the validation */
    public function print(LabOrder $order, LabPresenter $lab): Response
    {
        return Inertia::render('lab/imprimir', [
            'order' => $lab->detail($order, false),
            'clinic' => ['name' => config('cemerog.clinic.name'), 'phone' => config('cemerog.clinic.phone'), 'address' => config('cemerog.clinic.address')],
        ]);
    }

    /** @return array<string, mixed> */
    private function history(Request $request, LabPresenter $lab): array
    {
        $q = trim($request->string('q')->toString());
        $days = (int) $request->string('rango', '30')->toString();

        $query = LabOrder::with(['patient', 'doctor', 'items.results'])
            ->whereIn('status', ['validada', 'entregada'])
            ->when($days > 0, fn (Builder $b) => $b->where('validated_at', '>=', now()->subDays($days)))
            ->when($request->integer('prueba') > 0, fn (Builder $b) => $b->whereHas('items', fn (Builder $i) => $i->where('lab_test_id', $request->integer('prueba'))))
            ->when($q !== '', function (Builder $b) use ($q): void {
                $b->where(function (Builder $w) use ($q): void {
                    $w->where('number', 'like', "%{$q}%")
                        ->orWhereHas('items', fn (Builder $i) => $i->where('name', 'like', "%{$q}%"))
                        ->orWhereHas('patient', fn (Builder $p) => app(SearchPatients::class)->applyTo($p, $q));
                });
            })
            ->orderByDesc('validated_at');

        $page = $query->paginate(15)->withQueryString();

        return [
            'data' => collect($page->items())->map(fn (LabOrder $o): array => $lab->row($o))->all(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'total' => $page->total(),
        ];
    }

    /** @return array<int|string, string|null> */
    private function values(Request $request): array
    {
        $data = $request->validate(['results' => ['required', 'array'], 'results.*' => ['nullable', 'string', 'max:80']]);

        return (array) $data['results'];
    }

    private function canValidate(?User $user): bool
    {
        return $user !== null && $user->hasAnyRole(self::VALIDATOR_ROLES);
    }
}
