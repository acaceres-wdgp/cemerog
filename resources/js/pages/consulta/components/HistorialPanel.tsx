import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ClinicalEntry, ClinicalEntryType } from '../types';
import HistorialList from './HistorialList';
import HistorialDetail from './HistorialDetail';

// ─── Filter config ────────────────────────────────────────────────────────────

type TypeFilter = 'all' | 'consulta' | 'receta' | 'analisis';
type OwnerFilter = 'all' | 'mine' | 'other';

const LAB_IMAGE_TYPES: ClinicalEntryType[] = ['laboratorio', 'imagen'];

function applyFilters(
    entries: ClinicalEntry[],
    typeFilter: TypeFilter,
    ownerFilter: OwnerFilter,
): ClinicalEntry[] {
    return entries.filter((e) => {
        if (typeFilter === 'consulta' && e.type !== 'consulta') return false;
        if (typeFilter === 'receta' && e.type !== 'receta') return false;
        if (typeFilter === 'analisis' && !LAB_IMAGE_TYPES.includes(e.type))
            return false;
        if (ownerFilter === 'mine' && !e.mine) return false;
        if (ownerFilter === 'other' && e.mine) return false;
        return true;
    });
}

// ─── Filter button ────────────────────────────────────────────────────────────

function FilterBtn({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count?: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex h-8 cursor-pointer items-center gap-1 rounded-[8px] border px-3 font-sans text-[13px] font-medium',
                active
                    ? 'border-primary bg-primary text-white'
                    : 'border-secondary-border bg-secondary-bg text-secondary-fg',
            )}
        >
            {label}
            {count !== undefined && (
                <span
                    className={cn(
                        'ml-1 rounded-full px-[6px] py-[1px] text-[11px] font-bold',
                        active ? 'bg-white/20' : 'bg-surface text-muted',
                    )}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

// ─── HistorialPanel ───────────────────────────────────────────────────────────

export default function HistorialPanel({
    historial,
    canPrint = true,
}: {
    historial: ClinicalEntry[];
    canPrint?: boolean;
}) {
    const [selIdx, setSelIdx] = useState<number | null>(
        historial.length > 0 ? 0 : null,
    );
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');

    const countConsulta = historial.filter((e) => e.type === 'consulta').length;
    const countReceta = historial.filter((e) => e.type === 'receta').length;
    const countAnalisis = historial.filter((e) =>
        LAB_IMAGE_TYPES.includes(e.type),
    ).length;

    const filtered = applyFilters(historial, typeFilter, ownerFilter);

    // Keep selIdx valid after filtering
    const safeSelIdx =
        selIdx !== null && selIdx < filtered.length ? selIdx : null;

    const sel = safeSelIdx !== null ? filtered[safeSelIdx] : null;

    function handleTypeFilter(next: TypeFilter) {
        setTypeFilter((prev) => (prev === next ? 'all' : next));
        setSelIdx(null);
    }

    function handleOwnerFilter(next: OwnerFilter) {
        setOwnerFilter((prev) => (prev === next ? 'all' : next));
        setSelIdx(null);
    }

    if (historial.length === 0) {
        return (
            <div className="mt-2 overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="border-b border-divider px-5 py-[14px]">
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Historial en la clínica
                    </div>
                    <div className="text-[13px] text-muted">0 registros</div>
                </div>
                <div className="px-6 py-12 text-center text-muted">
                    <div className="mb-[10px] text-[32px]">📋</div>
                    <div className="mb-1 text-[14px] font-semibold text-secondary-fg">
                        Sin historial registrado
                    </div>
                    <p className="m-0 text-[13px]">
                        Las consultas guardadas de este paciente aparecerán
                        aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 overflow-hidden rounded-[14px] border border-card-border bg-white">
            {/* Header + filters */}
            <div className="border-b border-divider px-5 py-[14px]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="font-serif text-[16px] font-semibold text-text-heading">
                            Historial en la clínica
                        </div>
                        <div className="text-[13px] text-muted">
                            {historial.length} registros
                        </div>
                    </div>
                </div>
                {/* Type filters */}
                <div className="mb-2 flex flex-wrap gap-2">
                    <FilterBtn
                        label="Todo"
                        active={typeFilter === 'all'}
                        onClick={() => setTypeFilter('all')}
                    />
                    <FilterBtn
                        label="Notas clínicas"
                        count={countConsulta}
                        active={typeFilter === 'consulta'}
                        onClick={() => handleTypeFilter('consulta')}
                    />
                    <FilterBtn
                        label="Recetas"
                        count={countReceta}
                        active={typeFilter === 'receta'}
                        onClick={() => handleTypeFilter('receta')}
                    />
                    <FilterBtn
                        label="Análisis e imágenes"
                        count={countAnalisis}
                        active={typeFilter === 'analisis'}
                        onClick={() => handleTypeFilter('analisis')}
                    />
                </div>
                {/* Owner filters */}
                <div className="flex flex-wrap gap-2">
                    <FilterBtn
                        label="Todos"
                        active={ownerFilter === 'all'}
                        onClick={() => setOwnerFilter('all')}
                    />
                    <FilterBtn
                        label="Míos"
                        active={ownerFilter === 'mine'}
                        onClick={() => handleOwnerFilter('mine')}
                    />
                    <FilterBtn
                        label="Otros"
                        active={ownerFilter === 'other'}
                        onClick={() => handleOwnerFilter('other')}
                    />
                </div>
            </div>

            {/* List + detail */}
            {typeFilter === 'analisis' ? (
                <div className="px-6 py-10 text-center text-muted">
                    <div className="mb-1 text-[14px] font-semibold text-secondary-fg">
                        Disponible cuando se implementen Laboratorio e Imágenes
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="px-6 py-10 text-center text-[13px] text-muted">
                    Sin registros para el filtro seleccionado.
                </div>
            ) : (
                <div className="flex flex-wrap items-stretch">
                    <HistorialList
                        historial={filtered}
                        selIdx={safeSelIdx}
                        onSelect={(idx) => setSelIdx(idx)}
                    />
                    <HistorialDetail sel={sel} canPrint={canPrint} />
                </div>
            )}
        </div>
    );
}
