import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import caja from '@/routes/caja';
import type { ProfilePayment } from './types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** Pagos recibidos: one row per income receipt */
export default function PaymentsTable({ pagos }: { pagos: ProfilePayment[] }) {
    return (
        <section className="overflow-x-auto rounded-2xl border border-card-border bg-white">
            <h2 className="m-0 border-b border-divider px-5 py-3 font-serif text-[16px] font-semibold text-text-heading">
                Pagos recibidos
            </h2>
            {pagos.length === 0 ? (
                <p className="p-8 text-center text-muted">
                    No hay pagos registrados.
                </p>
            ) : (
                <table className="w-full min-w-[640px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Recibo</th>
                            <th className={`${th} text-left`}>Fecha</th>
                            <th className={`${th} text-left`}>Factura</th>
                            <th className={`${th} text-left`}>Método</th>
                            <th className={`${th} text-left`}>Tipo</th>
                            <th className={`${th} pr-5 text-right`}>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagos.map((p) => (
                            <tr
                                key={p.id}
                                className={cn(p.voided && 'text-muted')}
                            >
                                <td className={`${td} pl-5`}>
                                    <a
                                        href={caja.receipts.print.url(p.id)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-mono text-[12.5px] font-semibold text-primary"
                                    >
                                        {p.number}
                                    </a>
                                </td>
                                <td className={`${td} tabular-nums`}>
                                    {p.date}
                                </td>
                                <td className={`${td} font-mono text-[12.5px]`}>
                                    {p.invoice_number}
                                </td>
                                <td className={td}>{p.methods}</td>
                                <td
                                    className={cn(
                                        td,
                                        p.voided
                                            ? 'text-error'
                                            : 'text-text-secondary',
                                    )}
                                >
                                    {p.kind}
                                </td>
                                <td
                                    className={cn(
                                        td,
                                        'pr-5 text-right font-semibold tabular-nums',
                                        p.voided && 'line-through',
                                    )}
                                >
                                    {formatMoney(p.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
