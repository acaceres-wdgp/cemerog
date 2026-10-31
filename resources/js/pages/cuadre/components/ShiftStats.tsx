import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CashShiftView } from '../types';
import {
    cardCls,
    differenceClass,
    differenceLabel,
    differenceText,
} from './cuadreMath';

/** Fondo de apertura · Ingresos · Total esperado · Diferencia */
export default function ShiftStats({
    shift,
    expected,
    counted,
}: {
    shift: CashShiftView;
    expected: number;
    counted: number;
}) {
    const s = shift.summary;
    const income =
        s.income.efectivo + s.income.tarjeta + s.income.transferencia;
    const receipts = new Set(
        shift.movements.filter((m) => !m.voided).map((m) => m.receipt_id),
    ).size;
    const diff = counted - expected;

    const stats = [
        {
            label: 'Fondo de apertura',
            value: formatMoney(s.opening),
            sub: 'efectivo inicial',
            cls: 'text-text-heading',
        },
        {
            label: 'Ingresos del turno',
            value: formatMoney(income),
            sub: `${receipts} ${receipts === 1 ? 'recibo' : 'recibos'}`,
            cls: 'text-text-heading',
        },
        {
            label: 'Total esperado',
            value: formatMoney(expected),
            sub:
                s.withdrawals > 0
                    ? `apertura + ingresos − retiros ${formatMoney(s.withdrawals)}`
                    : 'apertura + ingresos',
            cls: 'text-text-heading',
        },
        {
            label: differenceLabel(diff),
            value: differenceText(diff),
            sub: `contado ${formatMoney(counted)}`,
            cls: differenceClass(diff),
        },
    ];

    return (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {stats.map((k) => (
                <div key={k.label} className={cn(cardCls, 'px-[18px] py-4')}>
                    <div className="text-[13px] text-text-secondary">
                        {k.label}
                    </div>
                    <div
                        className={cn(
                            'mt-1 font-serif text-[22px] font-bold [overflow-wrap:anywhere] tabular-nums',
                            k.cls,
                        )}
                    >
                        {k.value}
                    </div>
                    <div className="text-[12.5px] text-text-tertiary">
                        {k.sub}
                    </div>
                </div>
            ))}
        </div>
    );
}
