import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import cuadre from '@/routes/cuadre';
import type { ClosedShift } from '../types';

const thCls =
    'px-4 py-2 text-left text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase';

export default function ShiftHistory({ history }: { history: ClosedShift[] }) {
    return (
        <section className="rounded-2xl border border-card-border bg-white">
            <h2 className="m-0 border-b border-divider px-5 py-3 font-serif text-[16px] font-semibold text-text-heading">
                Turnos cerrados
            </h2>
            {history.length === 0 ? (
                <p className="px-5 py-6 text-center text-[13px] text-muted">
                    Todavía no hay turnos cerrados.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-[13px]">
                        <thead className="bg-app-bg">
                            <tr>
                                <th className={thCls}>Cajero</th>
                                <th className={thCls}>Apertura</th>
                                <th className={thCls}>Cierre</th>
                                <th className={`${thCls} text-right`}>
                                    Esperado
                                </th>
                                <th className={`${thCls} text-right`}>
                                    Contado
                                </th>
                                <th className={`${thCls} text-right`}>
                                    Diferencia
                                </th>
                                <th className={thCls}>
                                    <span className="sr-only">Reporte</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((s) => (
                                <tr
                                    key={s.id}
                                    className="border-t border-divider align-top"
                                >
                                    <td className="px-4 py-3 text-text-body">
                                        {s.opened_by}
                                        {s.close_note && (
                                            <p className="mt-0.5 text-[12px] text-muted">
                                                {s.close_note}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-muted tabular-nums">
                                        {s.opened_at}
                                    </td>
                                    <td className="px-4 py-3 text-muted tabular-nums">
                                        {s.closed_at}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatMoney(s.expected_cash)}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">
                                        {formatMoney(s.counted_cash)}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-4 py-3 text-right font-semibold tabular-nums',
                                            s.difference === 0
                                                ? 'text-accent-fg'
                                                : 'text-error',
                                        )}
                                    >
                                        {s.difference === 0
                                            ? 'Cuadrado'
                                            : `${s.difference < 0 ? '−' : '+'}${formatMoney(Math.abs(s.difference))}`}
                                    </td>
                                    <td className="px-4 py-3">
                                        <a
                                            href={cuadre.report.url(s.id)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[12.5px] font-semibold text-primary"
                                        >
                                            Reporte
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
