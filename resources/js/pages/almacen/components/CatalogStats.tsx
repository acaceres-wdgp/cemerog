import React from 'react';
import { cn } from '@/lib/utils';
import type { InventoryItemRow } from '../types';

export type AlertFilter = 'todas' | 'bajo' | 'vence';

/** Artículos activos · Bajo el mínimo · Vencen en 90 días o menos */
export default function CatalogStats({
    items,
    value,
    onChange,
}: {
    items: InventoryItemRow[];
    value: AlertFilter;
    onChange: (filter: AlertFilter) => void;
}) {
    const active = items.filter((i) => i.is_active);
    const stats: {
        key: AlertFilter;
        label: string;
        n: number;
        tone: string;
    }[] = [
        {
            key: 'todas',
            label: 'Artículos activos',
            n: active.length,
            tone: 'text-text-heading',
        },
        {
            key: 'bajo',
            label: 'Bajo el mínimo',
            n: active.filter((i) => i.low_stock).length,
            tone: 'state-espera text-[var(--state-text)]',
        },
        {
            key: 'vence',
            label: 'Vencen en 90 días o menos',
            n: active.filter((i) => i.expires_soon).length,
            tone: 'state-pendiente text-[var(--state-text)]',
        },
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            {stats.map((s) => (
                <button
                    key={s.key}
                    type="button"
                    aria-pressed={value === s.key}
                    onClick={() => onChange(value === s.key ? 'todas' : s.key)}
                    className={cn(
                        'cursor-pointer rounded-[14px] border px-[18px] py-4 text-left',
                        value === s.key && s.key !== 'todas'
                            ? 'border-primary bg-accent-bg/60'
                            : 'border-card-border bg-white hover:border-accent-tip-border',
                    )}
                >
                    <div className="text-[13px] text-text-secondary">
                        {s.label}
                    </div>
                    <div
                        className={cn(
                            'font-serif text-[30px] font-bold tabular-nums',
                            s.tone,
                        )}
                    >
                        {s.n}
                    </div>
                </button>
            ))}
        </div>
    );
}
