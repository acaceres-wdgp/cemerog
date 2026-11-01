import React from 'react';
import { BedSingle } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { FreeBed } from './types';

/** Free beds as selectable cards */
export default function BedOptions({
    beds,
    value,
    onChange,
}: {
    beds: FreeBed[];
    value: number | null;
    onChange: (id: number) => void;
}) {
    if (beds.length === 0) {
        return (
            <p className="m-0 rounded-[10px] bg-error-bg px-3 py-2 text-[13px] text-error-strong">
                No hay camas libres. Marca una cama como lista en el mapa de
                habitaciones.
            </p>
        );
    }

    return (
        <div
            role="radiogroup"
            aria-label="Habitación y cama"
            className="grid max-h-[220px] gap-1.5 overflow-y-auto sm:grid-cols-2"
        >
            {beds.map((b) => {
                const on = b.id === value;
                return (
                    <button
                        key={b.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => onChange(b.id)}
                        className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-2 text-left',
                            on
                                ? 'border-primary bg-accent-bg'
                                : 'border-card-border bg-white hover:bg-list-row-bg',
                        )}
                    >
                        <BedSingle className="h-4 w-4 text-primary" />
                        <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] font-medium">
                                {b.label}
                            </span>
                            <span className="block text-[12px] text-muted">
                                {b.type} · {formatMoney(b.daily_price)} / día
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
