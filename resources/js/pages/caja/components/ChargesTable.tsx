import React from 'react';
import { formatMoney } from '@/lib/money';
import type { ChargeRow } from '../types';

const th =
    'h-10 border-b border-accent-tip-border bg-list-row-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider px-3 py-[9px]';

/** Fecha · Descripción · Área · Cant. · Precio · Importe, as in the design */
export default function ChargesTable({ rows }: { rows: ChargeRow[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
                <thead>
                    <tr>
                        <th className={`${th} pl-5 text-left`}>Fecha</th>
                        <th className={`${th} text-left`}>Descripción</th>
                        <th className={`${th} text-left`}>Área</th>
                        <th className={`${th} text-right`}>Cant.</th>
                        <th className={`${th} text-right`}>Precio</th>
                        <th className={`${th} pr-5 text-right`}>Importe</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.id}>
                            <td
                                className={`${td} pl-5 text-text-dim tabular-nums`}
                            >
                                {r.date}
                            </td>
                            <td className={td}>{r.description}</td>
                            <td className={`${td} text-text-dim`}>{r.area}</td>
                            <td className={`${td} text-right`}>{r.quantity}</td>
                            <td className={`${td} text-right tabular-nums`}>
                                {formatMoney(r.unit_price)}
                            </td>
                            <td
                                className={`${td} pr-5 text-right tabular-nums`}
                            >
                                {formatMoney(r.total)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
