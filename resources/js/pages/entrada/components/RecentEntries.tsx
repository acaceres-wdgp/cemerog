import React from 'react';
import { formatMoney } from '@/lib/money';
import type { RecentEntry } from '../types';

export default function RecentEntries({ entries }: { entries: RecentEntry[] }) {
    return (
        <section className="rounded-[14px] border border-card-border bg-white">
            <h2 className="m-0 border-b border-divider px-5 py-[14px] font-serif text-[16px] font-semibold text-text-heading">
                Entradas recientes
            </h2>
            {entries.length === 0 && (
                <p className="m-0 px-5 py-6 text-center text-[13px] text-muted">
                    Todavía no hay entradas.
                </p>
            )}
            {entries.map((e) => (
                <div
                    key={e.id}
                    className="border-b border-divider px-5 py-3 last:border-b-0"
                >
                    <div className="flex justify-between gap-2">
                        <span className="font-mono text-[12.5px] font-semibold">
                            {e.number}
                        </span>
                        <span className="text-[12.5px] text-muted">
                            {e.received_on}
                        </span>
                    </div>
                    <div className="font-medium">{e.supplier}</div>
                    <div className="text-[12.5px] text-muted tabular-nums">
                        {e.lines_count}{' '}
                        {e.lines_count === 1 ? 'producto' : 'productos'} ·{' '}
                        {formatMoney(e.total_cost)}
                    </div>
                </div>
            ))}
        </section>
    );
}
