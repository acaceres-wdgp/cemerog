<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A category of the laboratory catalog (Hematología…) or a modality of the
 * imaging catalog (Radiografía…), editable by the administrator.
 *
 * @property int $id
 * @property string $kind laboratorio | imagen
 * @property string $name
 * @property int $position
 */
class StudyCategory extends Model
{
    public const KINDS = ['laboratorio', 'imagen'];

    protected $fillable = ['kind', 'name', 'position'];

    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    /**
     * Names of a kind, in their order.
     *
     * @return list<string>
     */
    public static function names(string $kind): array
    {
        return self::where('kind', $kind)->orderBy('position')->pluck('name')->values()->all();
    }

    /**
     * The catalog studies that use this category's name.
     *
     * @return Builder<LabTest>|Builder<ImagingStudy>
     */
    public function usageQuery(): Builder
    {
        return $this->kind === 'laboratorio'
            ? LabTest::where('category', $this->name)
            : ImagingStudy::where('modality', $this->name);
    }
}
