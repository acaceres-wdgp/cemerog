<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Http\Requests\LabTestRequest;
use App\Models\LabTest;
use App\Models\LabTestParameter;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** Administración › Catálogo de análisis */
class AnalisisController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('analisis/index', [
            'tests' => LabTest::with('parameters')->orderBy('category')->orderBy('name')->get()
                ->map(fn (LabTest $t): array => [
                    'id' => $t->id,
                    'code' => $t->code,
                    'name' => $t->name,
                    'category' => $t->category,
                    'preparation' => $t->preparation,
                    'price' => $t->price,
                    'is_active' => $t->is_active,
                    'parameters' => $t->parameters->map(fn (LabTestParameter $p): array => [
                        'name' => $p->name,
                        'result_type' => $p->result_type,
                        'unit' => $p->unit,
                        'min' => $p->min !== null ? (float) $p->min : null,
                        'max' => $p->max !== null ? (float) $p->max : null,
                        'normal_text' => $p->normal_text,
                        'reference' => $p->referenceText(),
                    ])->all(),
                ])->all(),
            'categories' => LabTest::CATEGORIES,
        ]);
    }

    public function store(LabTestRequest $request): RedirectResponse
    {
        $test = $this->save(new LabTest(['is_active' => true]), $request->validated());

        Toast::success("{$test->name} agregado al catálogo.");

        return back();
    }

    public function update(LabTestRequest $request, LabTest $test): RedirectResponse
    {
        $this->save($test, $request->validated());

        Toast::success("{$test->name} actualizado.");

        return back();
    }

    /** @param array<string, mixed> $data */
    private function save(LabTest $test, array $data): LabTest
    {
        return DB::transaction(function () use ($test, $data): LabTest {
            $test->fill([
                'code' => trim((string) $data['code']),
                'name' => trim((string) $data['name']),
                'category' => $data['category'],
                'preparation' => isset($data['preparation']) ? trim((string) $data['preparation']) ?: null : null,
                'price' => (int) $data['price'],
                'is_active' => (bool) ($data['is_active'] ?? $test->is_active ?? true),
            ])->save();

            // Results keep a copy of name and reference, so replacing is safe
            $test->parameters()->delete();
            foreach (array_values((array) $data['parameters']) as $i => $p) {
                $text = $p['result_type'] === 'texto';
                $test->parameters()->create([
                    'position' => $i + 1,
                    'name' => trim((string) $p['name']),
                    'result_type' => $p['result_type'],
                    'unit' => $text ? null : (($p['unit'] ?? null) ?: null),
                    'min' => $text ? null : ($p['min'] ?? null),
                    'max' => $text ? null : ($p['max'] ?? null),
                    'normal_text' => $text && ! empty($p['normal_text']) ? mb_strtoupper(trim((string) $p['normal_text'])) : null,
                ]);
            }

            return $test;
        });
    }
}
