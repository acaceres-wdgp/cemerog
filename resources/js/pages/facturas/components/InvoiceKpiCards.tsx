import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { InvoiceKpis } from '../types';

const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

/** Facturado · Cobrado · Pendiente de cobro · Anulado */
export default function InvoiceKpiCards({ kpis }: { kpis: InvoiceKpis }) {
    const percent = Math.round(
        (kpis.collected / Math.max(1, kpis.billed)) * 100,
    );
    const cards = [
        {
            label: 'Facturado',
            value: kpis.billed,
            note: plural(kpis.billed_count, 'factura', 'facturas'),
            dot: 'bg-primary',
        },
        {
            label: 'Cobrado',
            value: kpis.collected,
            note: `${percent} % de lo facturado`,
            dot: 'state-balance bg-[var(--state-accent)]',
        },
        {
            label: 'Pendiente de cobro',
            value: kpis.pending,
            note: `${kpis.pending_count} con balance`,
            dot: 'state-pendiente bg-[var(--state-accent)]',
        },
        {
            label: 'Anulado',
            value: kpis.voided,
            note: plural(kpis.voided_count, 'anulada', 'anuladas'),
            dot: 'state-cancelada bg-[var(--state-accent)]',
        },
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
            {cards.map((c) => (
                <div
                    key={c.label}
                    role="group"
                    aria-label={c.label}
                    className="rounded-[14px] border border-card-border bg-white px-4 py-[14px]"
                >
                    <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                        <span
                            aria-hidden
                            className={cn('h-2 w-2 rounded-full', c.dot)}
                        />
                        {c.label}
                    </div>
                    <div className="mt-1 font-serif text-[20px] font-bold text-text-heading tabular-nums">
                        {formatMoney(c.value)}
                    </div>
                    <div className="text-[12.5px] text-muted">{c.note}</div>
                </div>
            ))}
        </div>
    );
}
