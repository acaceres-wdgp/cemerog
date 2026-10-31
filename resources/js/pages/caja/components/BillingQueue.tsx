import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { INVOICE_STATUS_LABELS } from '../types';
import type { BillableAccount, InvoiceSummary } from '../types';

export type Selection =
    | { kind: 'account'; id: number }
    | { kind: 'invoice'; id: number }
    | null;

function Section({
    title,
    count,
    children,
}: {
    title: string;
    count: number;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="m-0 flex items-center justify-between px-4 pt-4 pb-2 text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                {title}
                <span className="text-text-tertiary">{count}</span>
            </h2>
            {count === 0 ? (
                <p className="px-4 pb-3 text-[12.5px] text-muted">Ninguna.</p>
            ) : (
                <ul className="m-0 list-none p-0">{children}</ul>
            )}
        </section>
    );
}

function Row({
    active,
    onClick,
    title,
    sub,
    amount,
    amountClass,
}: {
    active: boolean;
    onClick: () => void;
    title: string;
    sub: string;
    amount: number;
    amountClass?: string;
}) {
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    'flex w-full cursor-pointer items-center justify-between gap-3 border-0 border-l-[3px] px-4 py-2.5 text-left',
                    active
                        ? 'border-primary bg-accent-bg'
                        : 'border-transparent bg-transparent hover:bg-list-row-bg',
                )}
            >
                <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-text-heading">
                        {title}
                    </span>
                    <span className="block text-[12px] text-muted">{sub}</span>
                </span>
                <span
                    className={cn(
                        'shrink-0 text-[13px] font-semibold tabular-nums',
                        amountClass ?? 'text-text-heading',
                    )}
                >
                    {formatMoney(amount)}
                </span>
            </button>
        </li>
    );
}

/** Accounts to invoice, accounts still in care and recent invoices */
export default function BillingQueue({
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
    const isActive = (kind: 'account' | 'invoice', id: number) =>
        selection?.kind === kind && selection.id === id;

    return (
        <div className="divide-y divide-divider overflow-hidden rounded-2xl border border-card-border bg-white">
            <Section title="Pendientes de facturar" count={pending.length}>
                {pending.map((a) => (
                    <Row
                        key={a.id}
                        active={isActive('account', a.id)}
                        onClick={() => onSelect({ kind: 'account', id: a.id })}
                        title={a.patient.full_name}
                        sub={`Cuenta del ${a.service_date} · ${a.charges.length} cargos`}
                        amount={a.total}
                    />
                ))}
            </Section>
            <Section title="En atención" count={inCare.length}>
                {inCare.map((a) => (
                    <Row
                        key={a.id}
                        active={isActive('account', a.id)}
                        onClick={() => onSelect({ kind: 'account', id: a.id })}
                        title={a.patient.full_name}
                        sub={`Cuenta abierta · ${a.charges.length} cargos`}
                        amount={a.total}
                        amountClass="text-muted"
                    />
                ))}
            </Section>
            <Section title="Facturas" count={invoices.length}>
                {invoices.map((i) => (
                    <Row
                        key={i.id}
                        active={isActive('invoice', i.id)}
                        onClick={() => onSelect({ kind: 'invoice', id: i.id })}
                        title={`${i.number} · ${i.patient}`}
                        sub={`${INVOICE_STATUS_LABELS[i.status]} · ${i.issued_at}`}
                        amount={i.status === 'pendiente' ? i.balance : i.total}
                        amountClass={
                            i.status === 'pendiente'
                                ? 'text-error'
                                : i.status === 'anulada'
                                  ? 'text-muted line-through'
                                  : undefined
                        }
                    />
                ))}
            </Section>
        </div>
    );
}
