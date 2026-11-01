<?php

namespace App\Http\Controllers\Modules;

use App\Http\Controllers\Controller;
use App\Models\ImagingStudy;
use App\Models\LabTest;
use App\Models\StudyCategory;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Categories of the laboratory catalog and modalities of the imaging
 * catalog: add, rename (the catalog follows), reorder and delete if unused.
 * The route says which kind (laboratorio | imagen).
 */
class StudyCategoryController extends Controller
{
    /**
     * For the catalog page: each category with how many studies use it.
     *
     * @return list<array{id: int, name: string, count: int}>
     */
    public static function items(string $kind): array
    {
        $counts = $kind === 'laboratorio'
            ? LabTest::selectRaw('category as name, count(*) as n')->groupBy('category')->pluck('n', 'name')
            : ImagingStudy::selectRaw('modality as name, count(*) as n')->groupBy('modality')->pluck('n', 'name');

        return StudyCategory::where('kind', $kind)->orderBy('position')->get()
            ->map(fn (StudyCategory $c): array => ['id' => $c->id, 'name' => $c->name, 'count' => (int) ($counts[$c->name] ?? 0)])
            ->values()
            ->all();
    }

    public function store(Request $request): RedirectResponse
    {
        $kind = $this->kind($request);
        $name = $this->validName($request, $kind);
        StudyCategory::create([
            'kind' => $kind,
            'name' => $name,
            'position' => (int) StudyCategory::where('kind', $kind)->max('position') + 1,
        ]);

        Toast::success("«{$name}» agregada.");

        return back();
    }

    public function update(Request $request, StudyCategory $category): RedirectResponse
    {
        $kind = $this->kind($request);
        $this->ensureKind($category, $kind);
        $name = $this->validName($request, $kind, $category);
        $old = $category->name;

        DB::transaction(function () use ($category, $name): void {
            // The catalog keeps the name as text: it follows the rename
            $category->usageQuery()->update([$category->kind === 'laboratorio' ? 'category' : 'modality' => $name]);
            $category->update(['name' => $name]);
        });

        Toast::success("«{$old}» ahora se llama «{$name}».");

        return back();
    }

    /** One step up or down in the order */
    public function move(Request $request, StudyCategory $category): RedirectResponse
    {
        $kind = $this->kind($request);
        $this->ensureKind($category, $kind);
        $direction = $request->validate(['direction' => ['required', Rule::in(['up', 'down'])]])['direction'];

        $neighbour = StudyCategory::where('kind', $kind)
            ->where('position', $direction === 'up' ? '<' : '>', $category->position)
            ->orderBy('position', $direction === 'up' ? 'desc' : 'asc')
            ->first();

        if ($neighbour !== null) {
            DB::transaction(function () use ($category, $neighbour): void {
                $position = $category->position;
                $category->update(['position' => $neighbour->position]);
                $neighbour->update(['position' => $position]);
            });
        }

        return back();
    }

    public function destroy(Request $request, StudyCategory $category): RedirectResponse
    {
        $this->ensureKind($category, $this->kind($request));
        $used = $category->usageQuery()->count();
        if ($used > 0) {
            throw ValidationException::withMessages(['category' => "«{$category->name}» tiene {$used} ".($used === 1 ? 'estudio' : 'estudios').'. Muévelos a otra antes de eliminarla.']);
        }
        $category->delete();

        Toast::success("«{$category->name}» eliminada.");

        return back();
    }

    private function validName(Request $request, string $kind, ?StudyCategory $category = null): string
    {
        $request->merge(['name' => trim((string) $request->input('name'))]);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40', Rule::unique('study_categories', 'name')->where('kind', $kind)->ignore($category?->id)],
        ], [
            'name.required' => 'Escribe el nombre.',
            'name.unique' => 'Ya existe con ese nombre.',
        ]);

        return $data['name'];
    }

    /** laboratorio | imagen, from the route */
    private function kind(Request $request): string
    {
        $kind = (string) $request->route('kind');
        abort_unless(in_array($kind, StudyCategory::KINDS, true), 404);

        return $kind;
    }

    private function ensureKind(StudyCategory $category, string $kind): void
    {
        abort_unless($category->kind === $kind, 404);
    }
}
