import React, { useMemo } from 'react';
import { Check, FlaskConical, ScanLine } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { LabCatalogItem } from './types';

/** Selected analyses → their preparations, without repeats */
export function preparationsOf(chosen: LabCatalogItem[]): string[] {
    return [
        ...new Set(chosen.map((c) => c.preparation).filter(Boolean)),
    ] as string[];
}

/**
 * Analyses grouped by category with a checkbox each, the (not yet enabled)
 * imaging block and the preparation of what is selected. Used by «Ordenar
 * estudios» and by Registro for a patient who comes only for analyses.
 */
export default function StudiesPicker({
    catalog,
    selected,
    onToggle,
}: {
    catalog: LabCatalogItem[];
    selected: number[];
    onToggle: (id: number) => void;
}) {
    const groups = useMemo(() => {
        const map = new Map<string, LabCatalogItem[]>();
        for (const item of catalog)
            map.set(item.category, [...(map.get(item.category) ?? []), item]);
        return [...map.entries()];
    }, [catalog]);
    const preparations = preparationsOf(
        catalog.filter((c) => selected.includes(c.id)),
    );

    return (
        <div className="flex flex-col gap-4">
            {groups.length === 0 && (
                <p className="m-0 text-[13px] text-muted">
                    No hay análisis activos en el catálogo.
                </p>
            )}
            {groups.map(([category, items]) => (
                <div key={category} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-text-heading">
                        <FlaskConical className="h-4 w-4 text-primary" />
                        Laboratorio · {category}
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
                                    <span className="min-w-0 flex-1">
                                        {t.name}
                                    </span>
                                    <span className="text-muted tabular-nums">
                                        {formatMoney(t.price)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
            <div className="flex items-center gap-2 rounded-[10px] border border-dashed border-input-border px-3 py-2 text-[13px] text-muted">
                <ScanLine className="h-4 w-4" />
                Imágenes · disponible próximamente
            </div>
            {preparations.length > 0 && (
                <p className="m-0 rounded-[10px] bg-info-bg px-3 py-2 text-[13px]">
                    <strong>Preparación:</strong> {preparations.join(' ')}
                </p>
            )}
        </div>
    );
}
