import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { ShiftMethod } from '../types';
import {
    cardCls,
    cardHeadCls,
    cardTitleCls,
    differenceClass,
    differenceText,
    plainAmount,
    tdCls,
    thCls,
} from './cuadreMath';

export type MethodRow = {
    method: ShiftMethod;
    label: string;
    note: string;
    transactions: number;
    expected: number;
    counted: number;
    /** Typed value in pesos; null for a read-only cell (cash, closed shift) */
    input: string | null;
    onInput?: (value: string) => void;
};

/** Método · Transacciones · Esperado · Contado · Diferencia */
export default function ExpectedVsCounted({ rows }: { rows: MethodRow[] }) {
    const total = (key: 'transactions' | 'expected' | 'counted') =>
        rows.reduce((sum, r) => sum + r[key], 0);
    const diff = total('counted') - total('expected');

    return (
        <section className={cn(cardCls, 'overflow-x-auto')}>
            <div className={cardHeadCls}>
                <h2 className={cardTitleCls}>Esperado vs. contado</h2>
            </div>
            <table className="w-full min-w-[620px] border-collapse text-[14px]">
                <thead>
                    <tr>
                        <th className={`${thCls} pl-5 text-left`}>Método</th>
                        <th className={`${thCls} text-right`}>Transacciones</th>
                        <th className={`${thCls} text-right`}>Esperado</th>
                        <th className={`${thCls} w-[170px] text-right`}>
                            Contado
                        </th>
                        <th className={`${thCls} pr-5 text-right`}>
                            Diferencia
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => {
                        const d = r.counted - r.expected;
                        return (
                            <tr key={r.method}>
                                <td className={`${tdCls} pl-5 font-medium`}>
                                    {r.label}
                                    <div className="text-[12px] font-normal text-text-tertiary">
                                        {r.note}
                                    </div>
                                </td>
                                <td
                                    className={`${tdCls} text-right tabular-nums`}
                                >
                                    {r.transactions}
                                </td>
                                <td
                                    className={`${tdCls} text-right tabular-nums`}
                                >
                                    {formatMoney(r.expected)}
                                </td>
                                <td className={`${tdCls} text-right`}>
                                    <input
                                        aria-label={`Contado ${r.label}`}
                                        inputMode="decimal"
                                        value={
                                            r.input ?? plainAmount(r.counted)
                                        }
                                        readOnly={r.input === null}
                                        onChange={(e) =>
                                            r.onInput?.(e.target.value)
                                        }
                                        className={cn(
                                            'h-8 w-[140px] rounded-lg border border-input-border px-[10px] text-right font-semibold tabular-nums outline-none focus:border-primary focus:ring-3 focus:ring-primary/15',
                                            r.input === null
                                                ? 'bg-list-row-bg'
                                                : 'bg-white',
                                        )}
                                    />
                                </td>
                                <td
                                    className={cn(
                                        tdCls,
                                        'pr-5 text-right font-semibold tabular-nums',
                                        differenceClass(d),
                                    )}
                                >
                                    {differenceText(d)}
                                </td>
                            </tr>
                        );
                    })}
                    <tr className="bg-list-row-bg font-bold">
                        <td className={`${tdCls} pl-5`}>Total</td>
                        <td
                            className={`${tdCls} text-right font-normal tabular-nums`}
                        >
                            {total('transactions')}
                        </td>
                        <td className={`${tdCls} text-right tabular-nums`}>
                            {formatMoney(total('expected'))}
                        </td>
                        <td className={`${tdCls} text-right tabular-nums`}>
                            {formatMoney(total('counted'))}
                        </td>
                        <td
                            className={cn(
                                tdCls,
                                'pr-5 text-right tabular-nums',
                                differenceClass(diff),
                            )}
                        >
                            {differenceText(diff)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>
    );
}
