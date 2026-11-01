import React, { useMemo } from 'react';
import { Check, FlaskConical, ScanLine } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type {
    ImagingCatalogItem,
    LabCatalogItem,
    StudySelection,
} from './types';

type Item = {
    id: number;
    name: string;
    price: number;
    preparation: string | null;
};

/** Selected studies of both catalogs */
export function chosenStudies(
    labCatalog: LabCatalogItem[],
    imagingCatalog: ImagingCatalogItem[],
    selected: StudySelection,
): Item[] {
    return [
        ...labCatalog.filter((c) => selected.lab.includes(c.id)),
        ...imagingCatalog.filter((c) => selected.imaging.includes(c.id)),
    ];
}

/** Selected studies → their preparations, without repeats */
export function preparationsOf(chosen: Item[]): string[] {
    return [
        ...new Set(chosen.map((c) => c.preparation).filter(Boolean)),
    ] as string[];
}

export const toggleIn = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

function groupBy<T extends Item>(items: T[], key: (item: T) => string) {
    const map = new Map<string, T[]>();
    for (const item of items)
        map.set(key(item), [...(map.get(key(item)) ?? []), item]);
    return [...map.entries()];
}

function Section({
    icon: Icon,
    title,
    items,
    selected,
    onToggle,
}: {
    icon: React.ElementType;
    title: string;
    items: Item[];
    selected: number[];
    onToggle: (id: number) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-text-heading">
                <Icon className="h-4 w-4 text-primary" />
                {title}
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2">
                {items.map((t) => {
                    const on = selected.includes(t.id);
                    return (
                        <button
                            key={t.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => onToggle(t.id)}
                            className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-[13.5px]',
                                on
                                    ? 'border-primary bg-accent-bg'
                                    : 'border-card-border bg-white hover:bg-list-row-bg',
                            )}
                        >
                            <span
                                className={cn(
                                    'inline-flex h-4 w-4 flex-none items-center justify-center rounded border',
                                    on
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-input-border',
                                )}
                            >
                                {on && <Check className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1">{t.name}</span>
                            <span className="text-muted tabular-nums">
                                {formatMoney(t.price)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Analyses grouped by category and imaging studies grouped by modality,
 * with a checkbox each and the preparation of what is selected. Used by
 * «Ordenar estudios» and by Registro for a patient who comes only for
 * studies.
 */
export default function StudiesPicker({
    labCatalog,
    imagingCatalog,
    selected,
    onChange,
}: {
    labCatalog: LabCatalogItem[];
    imagingCatalog: ImagingCatalogItem[];
    selected: StudySelection;
    onChange: (selected: StudySelection) => void;
}) {
    const labGroups = useMemo(
        () => groupBy(labCatalog, (t) => t.category),
        [labCatalog],
    );
    const imagingGroups = useMemo(
        () => groupBy(imagingCatalog, (s) => s.modality),
        [imagingCatalog],
    );
    const preparations = preparationsOf(
        chosenStudies(labCatalog, imagingCatalog, selected),
    );

    return (
        <div className="flex flex-col gap-4">
            {labGroups.length + imagingGroups.length === 0 && (
                <p className="m-0 text-[13px] text-muted">
                    No hay estudios activos en los catálogos.
                </p>
            )}
            {labGroups.map(([category, items]) => (
                <Section
                    key={`lab-${category}`}
                    icon={FlaskConical}
                    title={`Laboratorio · ${category}`}
                    items={items}
                    selected={selected.lab}
                    onToggle={(id) =>
                        onChange({
                            ...selected,
                            lab: toggleIn(selected.lab, id),
                        })
                    }
                />
            ))}
            {imagingGroups.map(([modality, items]) => (
                <Section
                    key={`img-${modality}`}
                    icon={ScanLine}
                    title={`Imágenes · ${modality}`}
                    items={items}
                    selected={selected.imaging}
                    onToggle={(id) =>
                        onChange({
                            ...selected,
                            imaging: toggleIn(selected.imaging, id),
                        })
                    }
                />
            ))}
            {preparations.length > 0 && (
                <p className="m-0 rounded-[10px] bg-info-bg px-3 py-2 text-[13px]">
                    <strong>Preparación:</strong> {preparations.join(' ')}
                </p>
            )}
        </div>
    );
}
