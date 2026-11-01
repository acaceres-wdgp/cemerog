<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImagingStudyRequest;
use App\Models\ImagingStudy;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/** Administración › Catálogo de imágenes */
class ImgcatController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('imgcat/index', [
            'studies' => ImagingStudy::orderBy('code')->get()
                ->map(fn (ImagingStudy $s): array => [
                    'id' => $s->id,
                    'code' => $s->code,
                    'name' => $s->name,
                    'modality' => $s->modality,
                    'preparation' => $s->preparation,
                    'price' => $s->price,
                    'is_active' => $s->is_active,
                ])->all(),
            'modalities' => ImagingStudy::MODALITIES,
            // Suggested code for a new study: I-06 after I-05
            'next_code' => sprintf('I-%02d', ImagingStudy::pluck('code')
                ->map(fn (string $c): int => (int) preg_replace('/\D/', '', $c))
                ->max() + 1),
        ]);
    }

    public function store(ImagingStudyRequest $request): RedirectResponse
    {
        $study = $this->save(new ImagingStudy(['is_active' => true]), $request->validated());

        Toast::success("{$study->code} · {$study->name} creado. Ya se puede indicar desde Consulta.");

        return back();
    }

    public function update(ImagingStudyRequest $request, ImagingStudy $study): RedirectResponse
    {
        $this->save($study, $request->validated());

        Toast::success("Estudio {$study->code} actualizado.");

        return back();
    }

    /** @param array<string, mixed> $data */
    private function save(ImagingStudy $study, array $data): ImagingStudy
    {
        $study->fill([
            'code' => mb_strtoupper(trim((string) $data['code'])),
            'name' => trim((string) $data['name']),
            'modality' => $data['modality'],
            'preparation' => isset($data['preparation']) ? trim((string) $data['preparation']) ?: null : null,
            'price' => (int) $data['price'],
            'is_active' => (bool) ($data['is_active'] ?? $study->is_active ?? true),
        ])->save();

        return $study;
    }
}
