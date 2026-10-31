import React from 'react';
import PrintablePage from '@/components/cemerog/PrintablePage';
import { formatMoney } from '@/lib/money';
import { paymentLabel } from '@/pages/caja/components/ReceiptsList';
import type { ShiftReceipt, ShiftSummary, Withdrawal } from './types';

type ShiftReport = {
    id: number;
    status: 'abierto' | 'cerrado';
    opened_by: string;
    opened_at: string;
    closed_by: string | null;
    closed_at: string | null;
    summary: ShiftSummary;
    expected_cash: number | null;
    counted_cash: number | null;
    difference: number | null;
    close_note: string | null;
    withdrawals: Withdrawal[];
    receipts: ShiftReceipt[];
};

function Row({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) {
    return (
        <div className="flex justify-between border-b border-divider py-1.5 text-[13px]">
            <span className="text-muted">{label}</span>
            <span
                className={
                    strong
                        ? 'font-semibold text-text-heading tabular-nums'
                        : 'tabular-nums'
                }
            >
                {value}
            </span>
        </div>
    );
}

export default function ReporteTurno({
    shift,
    clinic,
}: {
    shift: ShiftReport;
    clinic: { name: string | null };
}) {
    const s = shift.summary;
    const difference = shift.difference;

    return (
        <>
            {/* Print CSS: hide app chrome */}
            <style>{`@media print { body > *:not(#app) { display: none !important; } #app > *:not(.printable-root) { display: none !important; } }`}</style>
            <div className="printable-root min-h-screen bg-surface py-8 print:bg-white print:p-0 print:py-0">
                <PrintablePage showHeader={false}>
                    <div className="mb-5 flex items-start justify-between border-b border-divider pb-4">
                        <div>
                            <div className="font-serif text-[20px] font-bold text-primary">
                                {clinic.name ?? 'CEMEROG'}
                            </div>
                            <div className="text-[13px] font-semibold text-text-heading">
                                Cierre de caja · turno #{shift.id}
                            </div>
                        </div>
                        <div className="text-right text-[12.5px] text-muted">
                            <div>
                                Abierto por {shift.opened_by} ·{' '}
                                {shift.opened_at}
                            </div>
                            {shift.closed_at ? (
                                <div>
                                    Cerrado por {shift.closed_by} ·{' '}
                                    {shift.closed_at}
                                </div>
                            ) : (
                                <div className="font-semibold text-error">
                                    Turno abierto
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <Row
                            label="Fondo de apertura"
                            value={formatMoney(s.opening)}
                        />
                        <Row
                            label="Cobros en efectivo"
                            value={formatMoney(s.income.efectivo)}
                        />
                        <Row
                            label="Retiros"
                            value={`−${formatMoney(s.withdrawals)}`}
                        />
                        <Row
                            label="Efectivo esperado"
                            value={formatMoney(
                                shift.expected_cash ?? s.expected_cash,
                            )}
                            strong
                        />
                        {shift.counted_cash !== null && (
                            <Row
                                label="Efectivo contado"
                                value={formatMoney(shift.counted_cash)}
                                strong
                            />
                        )}
                        {difference !== null && (
                            <Row
                                label="Diferencia"
                                value={
                                    difference === 0
                                        ? 'Cuadrado'
                                        : `${difference < 0 ? 'Faltante' : 'Sobrante'} ${formatMoney(Math.abs(difference))}`
                                }
                                strong
                            />
                        )}
                        <Row
                            label="Cobros con tarjeta"
                            value={formatMoney(s.income.tarjeta)}
                        />
                        <Row
                            label="Cobros por transferencia"
                            value={formatMoney(s.income.transferencia)}
                        />
                        {shift.close_note && (
                            <p className="mt-2 text-[12.5px] text-muted">
                                Nota: {shift.close_note}
                            </p>
                        )}
                    </div>

                    <h2 className="mb-2 text-[13px] font-semibold text-text-heading">
                        Recibos
                    </h2>
                    {shift.receipts.length === 0 ? (
                        <p className="mb-6 text-[12.5px] text-muted">
                            Sin cobros.
                        </p>
                    ) : (
                        <ul className="mb-6 list-none p-0 text-[12.5px]">
                            {shift.receipts.map((r) => (
                                <li
                                    key={r.id}
                                    className="flex justify-between border-b border-divider py-1"
                                >
                                    <span>
                                        {r.number} · {r.invoice_number} ·{' '}
                                        {r.patient}
                                        <span className="block text-muted">
                                            {r.voided
                                                ? `Anulado: ${r.void_reason}`
                                                : r.payments
                                                      .map(paymentLabel)
                                                      .join(' + ')}
                                        </span>
                                    </span>
                                    <span
                                        className={
                                            r.voided
                                                ? 'text-muted tabular-nums line-through'
                                                : 'tabular-nums'
                                        }
                                    >
                                        {formatMoney(r.total)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <h2 className="mb-2 text-[13px] font-semibold text-text-heading">
                        Retiros
                    </h2>
                    {shift.withdrawals.length === 0 ? (
                        <p className="text-[12.5px] text-muted">Sin retiros.</p>
                    ) : (
                        <ul className="list-none p-0 text-[12.5px]">
                            {shift.withdrawals.map((w) => (
                                <li
                                    key={w.id}
                                    className="flex justify-between border-b border-divider py-1"
                                >
                                    <span>
                                        {w.time} · {w.reason} ({w.created_by})
                                    </span>
                                    <span className="tabular-nums">
                                        {formatMoney(w.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-12 flex justify-around text-center text-[12px] text-muted">
                        <div className="w-48 border-t border-text-heading pt-1">
                            Cajero
                        </div>
                        <div className="w-48 border-t border-text-heading pt-1">
                            Supervisor
                        </div>
                    </div>
                </PrintablePage>
                <div className="mt-4 flex justify-center print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        Imprimir
                    </button>
                </div>
            </div>
        </>
    );
}
