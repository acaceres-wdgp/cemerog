import React from 'react';
import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/pages/caja/types';

const STATUS: Record<InvoiceStatus, { label: string; tone: string }> = {
    pendiente: { label: 'Con balance', tone: 'state-balance' },
    pagada: { label: 'Saldada', tone: 'state-saldada' },
    anulada: { label: 'Anulada', tone: 'state-cancelada' },
};

export default function StatusPill({ status }: { status: InvoiceStatus }) {
    const s = STATUS[status];

    return (
        <span
            className={cn(
                s.tone,
                'inline-flex items-center gap-[5px] rounded-full bg-[var(--state-bg)] px-[9px] py-[2px] text-[11.5px] font-medium whitespace-nowrap text-[var(--state-text)]',
            )}
        >
            <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--state-accent)]" />
            {s.label}
        </span>
    );
}
