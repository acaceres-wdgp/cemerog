import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { METHOD_LABELS } from '@/pages/caja/types';
import type { Movement } from '../types';
import { cardCls, cardHeadCls, cardTitleCls, tdCls, thCls } from './cuadreMath';

/** Hora · Recibo · Paciente · Concepto · Método · Monto */
export default function ShiftMovements({
    movements,
}: {
    movements: Movement[];
}) {
    const n = movements.length;

    return (
        <section className={cn(cardCls, 'overflow-x-auto')}>
            <div className={cardHeadCls}>
                <h2 className={cardTitleCls}>Movimientos del turno</h2>
                <span className="text-[13px] text-muted">
                    {n} {n === 1 ? 'movimiento' : 'movimientos'}
                </span>
            </div>
            <table className="w-full min-w-[640px] border-collapse text-[14px]">
                <thead>
                    <tr>
                        <th className={`${thCls} pl-5 text-left`}>Hora</th>
                        <th className={`${thCls} text-left`}>Recibo</th>
                        <th className={`${thCls} text-left`}>Paciente</th>
                        <th className={`${thCls} text-left`}>Concepto</th>
                        <th className={`${thCls} text-left`}>Método</th>
                        <th className={`${thCls} pr-5 text-right`}>Monto</th>
                    </tr>
                </thead>
                <tbody>
                    {movements.map((m) => (
                        <tr key={m.id} className={cn(m.voided && 'text-muted')}>
                            <td className={`${tdCls} pl-5 tabular-nums`}>
                                {m.time}
                            </td>
                            <td className={`${tdCls} font-mono text-[12.5px]`}>
                                {m.receipt}
                            </td>
                            <td className={`${tdCls} font-medium`}>
                                {m.patient}
                            </td>
                            <td className={`${tdCls} text-text-secondary`}>
                                {m.concept}
                                {m.voided && ' · Anulado'}
                            </td>
                            <td className={tdCls}>{METHOD_LABELS[m.method]}</td>
                            <td
                                className={cn(
                                    tdCls,
                                    'pr-5 text-right tabular-nums',
                                    m.voided && 'line-through',
                                )}
                            >
                                {formatMoney(m.amount)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
