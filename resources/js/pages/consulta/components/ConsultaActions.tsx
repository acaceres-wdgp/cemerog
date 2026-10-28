import React from 'react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';

// ─── Consulta Actions (tabs + dar alta) ──────────────────────────────────────

const TABS = [
    { key: 'nota', label: 'Nota clínica' },
    { key: 'receta', label: 'Receta' },
    { key: 'cuenta', label: 'Cuenta / Órdenes' },
];

export default function ConsultaActions({
    activeTab,
    setActiveTab,
    turnId,
}: {
    activeTab: 'nota' | 'receta' | 'cuenta';
    setActiveTab: (tab: 'nota' | 'receta' | 'cuenta') => void;
    turnId: number;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex gap-[2px] rounded-[11px] border border-card-border bg-app-bg p-[3px]">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key as typeof activeTab)}
                        className={cn(
                            'h-[30px] cursor-pointer rounded-[10px] border-0 px-3 font-sans text-sm font-medium whitespace-nowrap',
                            activeTab === t.key
                                ? 'bg-white text-text-heading shadow-[0_1px_3px_rgba(0,0,0,.1)]'
                                : 'bg-transparent text-secondary-fg',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <button
                onClick={() =>
                    router.patch(`/consulta/turnos/${turnId}/alta`, {})
                }
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-4 font-sans text-sm font-medium whitespace-nowrap text-white"
            >
                ✓ Dar alta
            </button>
        </div>
    );
}
