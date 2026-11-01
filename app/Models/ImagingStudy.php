<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * An imaging study of the catalog (Administración › Catálogo de imágenes).
 *
 * @property int $id
 * @property string $code I-01
 * @property string $name
 * @property string $modality
 * @property string|null $preparation
 * @property int $price centavos
 * @property bool $is_active
 */
class ImagingStudy extends Model
{
    public const MODALITIES = ['Radiografía', 'Sonografía', 'Tomografía', 'Mamografía', 'Otro'];

    protected $fillable = ['code', 'name', 'modality', 'preparation', 'price', 'is_active'];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
