import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { BillableAccount, InvoiceSummary } from '../types';

export type Selection =
    | { kind: 'account'; id: number }
    | { kind: 'invoice'; id: number }
    | null;

type Tone = 'pendiente' | 'balance' | 'saldada' | 'atencion';

const TONE: Record<Tone, string> = {
    pendiente: 'state-pendiente',
    balance: 'state-balance',
    saldada: 'state-saldada',
    atencion: 'state-cancelada',
};

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
    return (
        <span
            className={cn(
                TONE[tone],
                'inline-flex items-center gap-[5px] rounded-full bg-[var(--state-bg)] px-2 py-[2px] text-[11px] font-medium whitespace-nowrap text-[var(--state-text)]',
            )}
        >
            <span className="h-[5px] w-[5px] flex-none rounded-full bg-[var(--state-accent)]" />
            {label}
        </span>
    );
}

type Item = {
    key: string;
    selection: NonNullable<Selection>;
    patient: string;
    amount: number;
    sub: string;
    tone: Tone;
    label: string;
};

/** «Cuentas en caja»: accounts to invoice, accounts in care and invoices */
export default function CajaQueue({
    pending,
    inCare,
    invoices,
    selection,
    onSelect,
}: {
    pending: BillableAccount[];
    inCare: BillableAccount[];
    invoices: InvoiceSummary[];
    selection: Selection;
    onSelect: (selection: Selection) => void;
}) {
    const items: Item[] = [
        ...pending.map((a) => ({
            key: `a${a.id}`,
            selection: { kind: 'account' as const, id: a.id },
            patient: a.patient.full_name,
            amount: a.total,
            sub: `Cuenta del ${a.service_date}`,
            tone: 'pendiente' as const,
            label: 'Pendiente de facturar',
        })),
        ...invoices.map((i) => ({
            key: `i${i.id}`,
            selection: { kind: 'invoice' as const, id: i.id },
            patient: i.patient,
            amount: i.status === 'pendiente' ? i.balance : i.total,
            sub: i.number,
            tone:
                i.status === 'pendiente'
                    ? ('balance' as const)
                    : i.status === 'pagada'
                      ? ('saldada' as const)
                      : ('atencion' as const),
            label:
                i.status === 'pendiente'
                    ? 'Facturada (con balance)'
                    : i.status === 'pagada'
                      ? 'Saldada'
                      : 'Anulada',
        })),
        ...inCare.map((a) => ({
            key: `c${a.id}`,
            selection: { kind: 'account' as const, id: a.id },
            patient: a.patient.full_name,
            amount: a.total,
            sub: `Cuenta del ${a.service_date}`,
            tone: 'atencion' as const,
            label: 'En atención',
        })),
    ];

    const active = (s: NonNullable<Selection>) =>
        selection?.kind === s.kind && selection.id === s.id;

    return (
        <div className="overflow-x-auto rounded-[14px] border border-card-border bg-white shadow-sm">
            <div className="px-4 py-[14px] font-semibold text-text-heading">
                Cuentas en caja
            </div>
            {items.length === 0 ? (
                <p className="px-4 pb-4 text-[13px] text-muted">
                    No hay cuentas pendientes.
                </p>
            ) : (
                <div className="flex flex-col gap-[2px] px-2 pb-2">
                    {items.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => onSelect(item.selection)}
                            className={cn(
                                'w-full cursor-pointer rounded-[10px] border-0 p-[10px] text-left',
                                active(item.selection)
                                    ? 'bg-accent-bg'
                                    : 'bg-transparent hover:bg-secondary-bg',
                            )}
                        >
                            <span className="flex justify-between gap-2">
                                <span className="font-medium text-text-heading">
                                    {item.patient}
                                </span>
                                <span className="font-medium text-text-heading tabular-nums">
                                    {formatMoney(item.amount)}
                                </span>
                            </span>
                            <span className="mt-1 flex items-center justify-between gap-2">
                                <span className="text-[12px] whitespace-nowrap text-muted">
                                    {item.sub}
                                </span>
                                <StatusPill
                                    tone={item.tone}
                                    label={item.label}
                                />
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
