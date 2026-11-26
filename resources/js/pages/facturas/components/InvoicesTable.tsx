import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { InvoiceListRow } from '../types';
import StatusPill from './StatusPill';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider px-3 py-[11px] align-middle';

/** Factura · Fecha · Paciente · Área · Condición · Total · Pagado · Balance · Estado · Cajero */
export default function InvoicesTable({
    rows,
    selectedId,
    onOpen,
}: {
    rows: InvoiceListRow[];
    selectedId: number | null;
    onOpen: (id: number) => void;
}) {
    return (
        <table className="w-full min-w-[1080px] border-collapse text-[14px]">
            <thead>
                <tr>
                    <th className={`${th} pl-5 text-left`}>Factura</th>
                    <th className={`${th} text-left`}>Fecha</th>
                    <th className={`${th} text-left`}>Paciente</th>
                    <th className={`${th} text-left`}>Área</th>
                    <th className={`${th} text-left`}>Condición</th>
                    <th className={`${th} text-right`}>Total</th>
                    <th className={`${th} text-right`}>Pagado</th>
                    <th className={`${th} text-right`}>Balance</th>
                    <th className={`${th} text-left`}>Estado</th>
                    <th className={`${th} pr-5 text-left`}>Cajero</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => {
                    const voided = r.status === 'anulada';
                    return (
                        <tr
                            key={r.id}
                            onClick={() => onOpen(r.id)}
                            className={cn(
                                'cursor-pointer',
                                selectedId === r.id
                                    ? 'bg-accent-bg'
                                    : 'hover:bg-list-row-bg',
                            )}
                        >
                            <td className={`${td} pl-5`}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpen(r.id);
                                    }}
                                    className="cursor-pointer border-0 bg-transparent p-0 font-mono text-[13px] font-semibold whitespace-nowrap text-primary underline underline-offset-2"
                                >
                                    {r.number}
                                </button>
                            </td>
                            <td
                                className={`${td} whitespace-nowrap tabular-nums`}
                            >
                                <div>{r.issued_on}</div>
                                <div className="text-[12px] text-muted">
                                    {r.issued_time}
                                </div>
                            </td>
                            <td className={`${td} min-w-[220px]`}>
                                <div className="font-semibold text-text-heading">
                                    {r.patient.full_name}
                                </div>
                                <div className="text-[12px] text-muted tabular-nums">
                                    {r.patient.document_number}
                                </div>
                            </td>
                            <td
                                className={`${td} whitespace-nowrap text-text-secondary`}
                            >
                                {r.area}
                            </td>
                            <td
                                className={`${td} whitespace-nowrap text-text-secondary`}
                            >
                                {r.condition}
                            </td>
                            <td
                                className={cn(
                                    td,
                                    'text-right whitespace-nowrap tabular-nums',
                                    voided
                                        ? 'text-muted line-through'
                                        : 'text-text-heading',
                                )}
                            >
                                {formatMoney(r.total)}
                            </td>
                            <td
                                className={`${td} text-right whitespace-nowrap text-text-secondary tabular-nums`}
                            >
                                {voided ? '—' : formatMoney(r.paid_amount)}
                            </td>
                            <td
                                className={cn(
                                    td,
                                    'text-right whitespace-nowrap tabular-nums',
                                    r.balance > 0
                                        ? 'state-pendiente font-semibold text-[var(--state-text)]'
                                        : 'text-text-secondary',
                                )}
                            >
                                {voided ? '—' : formatMoney(r.balance)}
                            </td>
                            <td className={td}>
                                <StatusPill status={r.status} />
                            </td>
                            <td
                                className={`${td} pr-5 text-[13px] whitespace-nowrap text-text-secondary`}
                            >
                                {r.cashier}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
