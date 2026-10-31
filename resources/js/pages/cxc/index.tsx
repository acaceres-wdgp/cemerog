import React from 'react';
import { router } from '@inertiajs/react';
import { HandCoins } from 'lucide-react';
import EmptyState from '@/components/cemerog/EmptyState';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import AccountPanel from '@/pages/caja/components/AccountPanel';
import type { InvoiceDetail, InvoiceSummary } from '@/pages/caja/types';
import { cxc } from '@/routes';

type Filter = 'todas' | 'vencidas' | 'al_dia';

type Receivable = InvoiceSummary & { overdue: boolean };

type CxcProps = {
    invoices: Receivable[];
    totals: {
        receivable: number;
        overdue: number;
        count: number;
        overdue_count: number;
    };
    filter: Filter;
    selected_invoice: InvoiceDetail | null;
    can_void: boolean;
};

function Total({
    label,
    value,
    sub,
    danger = false,
}: {
    label: string;
    value: number;
    sub: string;
    danger?: boolean;
}) {
    return (
        <div
            className={cn(
                'min-w-[180px] flex-1 rounded-[12px] border px-4 py-3',
                danger
                    ? 'border-error-border bg-error-bg'
                    : 'border-card-border bg-white',
            )}
        >
            <p className="text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                {label}
            </p>
            <p
                className={cn(
                    'mt-1 font-serif text-[20px] font-semibold tabular-nums',
                    danger ? 'text-error' : 'text-text-heading',
                )}
            >
                {formatMoney(value)}
            </p>
            <p className="text-[12px] text-muted">{sub}</p>
        </div>
    );
}

export default function CxcIndex({
    invoices,
    totals,
    filter,
    selected_invoice,
    can_void,
}: CxcProps) {
    const visit = (query: Record<string, string | number>, only?: string[]) =>
        router.get(
            cxc.url({ query }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                ...(only ? { only } : {}),
            },
        );

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h1 className="m-0 font-serif text-[26px] font-semibold text-text-heading">
                    Cuentas por cobrar
                </h1>
                <p className="mt-1 text-muted">
                    Facturas emitidas con balance pendiente.
                </p>
            </div>

            <div className="flex flex-wrap gap-3">
                <Total
                    label="Por cobrar"
                    value={totals.receivable}
                    sub={`${totals.count} facturas`}
                />
                <Total
                    label="Vencido"
                    value={totals.overdue}
                    sub={`${totals.overdue_count} con la fecha compromiso pasada`}
                    danger={totals.overdue > 0}
                />
            </div>

            <SegmentedControl<Filter>
                segments={[
                    { value: 'todas', label: 'Todas' },
                    {
                        value: 'vencidas',
                        label: 'Vencidas',
                        count: totals.overdue_count,
                    },
                    { value: 'al_dia', label: 'Al día' },
                ]}
                value={filter}
                onChange={(f) => visit({ filtro: f })}
                className="self-start"
            />

            <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-[280px] flex-[1_1_360px] overflow-hidden rounded-2xl border border-card-border bg-white">
                    {invoices.length === 0 ? (
                        <EmptyState
                            icon={HandCoins}
                            title="Nada por cobrar"
                            description="No hay facturas con balance para este filtro."
                            className="py-8"
                        />
                    ) : (
                        <ul className="m-0 list-none divide-y divide-divider p-0">
                            {invoices.map((i) => (
                                <li key={i.id}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            visit(
                                                {
                                                    filtro: filter,
                                                    factura: i.id,
                                                },
                                                ['selected_invoice'],
                                            )
                                        }
                                        className={cn(
                                            'flex w-full cursor-pointer items-center justify-between gap-3 border-0 border-l-[3px] px-4 py-3 text-left',
                                            selected_invoice?.id === i.id
                                                ? 'border-primary bg-accent-bg'
                                                : 'border-transparent bg-transparent hover:bg-list-row-bg',
                                        )}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-[13.5px] font-semibold text-text-heading">
                                                {i.patient}
                                            </span>
                                            <span className="block text-[12px] text-muted">
                                                {i.number} ·{' '}
                                                {i.credit_due_date
                                                    ? `compromiso ${i.credit_due_date}`
                                                    : 'sin fecha compromiso'}
                                            </span>
                                        </span>
                                        <span className="shrink-0 text-right">
                                            <span className="block text-[13px] font-semibold text-error tabular-nums">
                                                {formatMoney(i.balance)}
                                            </span>
                                            {i.overdue && (
                                                <span className="text-[11.5px] font-semibold text-error">
                                                    Vencida
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="min-w-[320px] flex-[2_1_520px]">
                    {selected_invoice ? (
                        <AccountPanel
                            invoice={selected_invoice}
                            canVoid={can_void}
                        />
                    ) : (
                        <div className="rounded-2xl border border-card-border bg-white py-10">
                            <EmptyState
                                title="Elige una factura"
                                description="Desde aquí se registran los abonos."
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
