import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { HistorialEntry } from '../types';
import HistorialList from './HistorialList';
import HistorialDetail from './HistorialDetail';

// ─── HistorialPanel ───────────────────────────────────────────────────────────

export default function HistorialPanel({
    historial,
}: {
    historial: HistorialEntry[];
}) {
    const [selId, setSelId] = useState<number | null>(historial[0]?.id ?? null);
    const [showingReceta, setShowingReceta] = useState(false);
    const [filterRecetas, setFilterRecetas] = useState(false);

    const filtered = filterRecetas
        ? historial.filter((e) => !!e.prescription_id)
        : historial;

    const sel = historial.find((h) => h.id === selId) ?? null;

    function handleSelect(id: number) {
        if (id !== selId) setShowingReceta(false);
        setSelId((prev) => (prev === id ? null : id));
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-[14px]">
                <div>
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Historial en la clínica
                    </div>
                    <div className="text-[13px] text-muted">
                        {historial.length} registros
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterRecetas((v) => !v)}
                        aria-label="Recetas"
                        className={cn(
                            'inline-flex h-8 cursor-pointer items-center gap-1 rounded-[8px] border px-3 font-sans text-[13px] font-medium',
                            filterRecetas
                                ? 'border-primary bg-primary text-white'
                                : 'border-secondary-border bg-secondary-bg text-secondary-fg',
                        )}
                    >
                        Recetas
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap items-stretch">
                <HistorialList
                    historial={filtered}
                    selId={selId}
                    onSelect={handleSelect}
                />
                <HistorialDetail
                    sel={sel}
                    onViewReceta={() => setShowingReceta(true)}
                    showingReceta={showingReceta}
                />
            </div>
        </div>
    );
}
