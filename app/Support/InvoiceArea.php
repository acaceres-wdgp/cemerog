<?php

namespace App\Support;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Builder;

/**
 * The main area of an invoice. An account can have charges of several
 * areas (consulta + laboratorio + farmacia), so the invoice takes the most
 * important one of the visit: Cirugía > Internamiento > Emergencia >
 * Consulta > Imágenes > Laboratorio; anything else is «Otros».
 */
class InvoiceArea
{
    /** Area => charge types that make it, most important first */
    public const PRIORITY = [
        'Cirugía' => ['cirugia'],
        'Internamiento' => ['habitacion'],
        'Emergencia' => ['emergencia'],
        'Consulta' => ['consulta'],
        'Imágenes' => ['imagen'],
        'Laboratorio' => ['laboratorio'],
    ];

    public const OTHER = 'Otros';

    /** @return list<string> */
    public static function all(): array
    {
        return [...array_keys(self::PRIORITY), self::OTHER];
    }

    /** @param  iterable<string>  $types  charge types of the invoice lines */
    public static function of(iterable $types): string
    {
        $types = collect($types);
        foreach (self::PRIORITY as $area => $areaTypes) {
            if ($types->intersect($areaTypes)->isNotEmpty()) {
                return $area;
            }
        }

        return self::OTHER;
    }

    /**
     * Invoices whose main area is $area: they have a line of that area and
     * none of a more important one.
     *
     * @param  Builder<Invoice>  $query
     */
    public static function scope(Builder $query, string $area): void
    {
        $higher = [];
        foreach (self::PRIORITY as $name => $types) {
            if ($name === $area) {
                $query->whereHas('lines', fn ($l) => $l->whereIn('type', $types));
                break;
            }
            $higher = [...$higher, ...$types];
        }
        if ($area === self::OTHER) {
            $higher = array_merge(...array_values(self::PRIORITY));
        }
        if ($higher !== []) {
            $query->whereDoesntHave('lines', fn ($l) => $l->whereIn('type', $higher));
        }
    }
}
