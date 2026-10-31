import React from 'react';
import { formatMoney } from '@/lib/money';
import type { ShiftSummary } from '../types';

function Card({
    label,
    value,
    sub,
    strong = false,
}: {
    label: string;
    value: number;
    sub: string;
    strong?: boolean;
}) {
    return (
        <div className="min-w-[170px] flex-1 rounded-[12px] border border-card-border bg-white px-4 py-3">
            <p className="text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                {label}
            </p>
            <p
                className={
                    strong
                        ? 'mt-1 font-serif text-[22px] font-semibold text-primary tabular-nums'
                        : 'mt-1 font-serif text-[20px] font-semibold text-text-heading tabular-nums'
                }
            >
                {formatMoney(value)}
            </p>
            <p className="text-[12px] text-muted">{sub}</p>
        </div>
    );
}

/** Opening float, cash in, withdrawals and the cash that must be in the drawer */
export default function ShiftSummaryCards({
    summary,
}: {
    summary: ShiftSummary;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-3">
                <Card
                    label="Fondo de apertura"
                    value={summary.opening}
                    sub="efectivo inicial"
                />
                <Card
                    label="Cobros en efectivo"
                    value={summary.income.efectivo}
                    sub="recibos del turno"
                />
                <Card
                    label="Retiros"
                    value={summary.withdrawals}
                    sub="efectivo sacado de caja"
                />
                <Card
                    label="Efectivo esperado"
                    value={summary.expected_cash}
                    sub="apertura + cobros − retiros"
                    strong
                />
            </div>
            <p className="text-[12.5px] text-muted">
                Fuera de la gaveta: tarjeta{' '}
                <span className="font-semibold text-text-body tabular-nums">
                    {formatMoney(summary.income.tarjeta)}
                </span>{' '}
                · transferencia{' '}
                <span className="font-semibold text-text-body tabular-nums">
                    {formatMoney(summary.income.transferencia)}
                </span>
            </p>
        </div>
    );
}
