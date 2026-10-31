import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { ReceivableRow } from '../types';
import { AGES, bucketOf, invoicesLabel } from './aging';
import type { Bucket } from './aging';

/** Todas · 0–30 · 31–60 · 61–90 · Más de 90 días; each one filters the table */
export default function AgingCards({
    invoices,
    value,
    onChange,
}: {
    invoices: ReceivableRow[];
    value: Bucket;
    onChange: (bucket: Bucket) => void;
}) {
    const cards: { key: Bucket; label: string; dot: string }[] = [
        { key: 'todas', label: 'Todas', dot: 'bg-primary' },
        ...(Object.keys(AGES) as Exclude<Bucket, 'todas'>[]).map((k) => ({
            key: k,
            label: AGES[k].label,
            dot: AGES[k].dot,
        })),
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
            {cards.map((c) => {
                const rows =
                    c.key === 'todas'
                        ? invoices
                        : invoices.filter((i) => bucketOf(i.days) === c.key);
                const active = value === c.key;
                return (
                    <button
                        key={c.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onChange(c.key)}
                        className={cn(
                            'cursor-pointer rounded-[14px] border px-[18px] py-4 text-left shadow-[0_1px_2px_rgba(16,40,24,.03)]',
                            active
                                ? 'border-primary bg-accent-bg/60'
                                : 'border-card-border bg-white hover:bg-list-row-bg',
                        )}
                    >
                        <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                            <span
                                className={cn('h-2 w-2 rounded-full', c.dot)}
                            />
                            {c.label}
                        </div>
                        <div className="mt-1 font-serif text-[22px] font-bold text-text-heading tabular-nums">
                            {formatMoney(
                                rows.reduce((sum, i) => sum + i.balance, 0),
                            )}
                        </div>
                        <div className="text-[12.5px] text-text-tertiary">
                            {invoicesLabel(rows.length)}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
