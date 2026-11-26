import React from 'react';
import PrintablePage from '@/components/cemerog/PrintablePage';
import ClinicHeader, {
    type ClinicInfo,
} from '@/components/cemerog/ClinicHeader';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { paymentLabel } from '@/pages/caja/components/ReceiptsList';
import type { ReceiptRow } from '@/pages/caja/types';
import type { ShiftMethod, ShiftSummary } from './types';

type DayShift = {
    id: number;
    label: string;
    status: 'abierto' | 'cerrado';
    opened_by: string;
    opened_at: string | null;
    closed_by: string | null;
    closed_at: string | null;
    summary: ShiftSummary;
    expected_cash: number;
    counted_cash: number | null;
    difference: number | null;
    close_note: string | null;
};

export type CashDay = {
    date: string;
    label: string;
    shifts: DayShift[];
    open_shifts: number;
    totals: {
        opening: number;
        income: Record<ShiftMethod, number>;
        collected: number;
        withdrawals: number;
        expected_cash: number;
        counted_cash: number | null;
        difference: number | null;
    };
    receipts: (ReceiptRow & {
        shift: string;
        time: string | null;
        invoice_number: string;
        patient: string;
    })[];
    withdrawals: {
        id: number;
        shift: string;
        time: string | null;
        amount: number;
        reason: string;
        created_by: string;
    }[];
    billing: {
        count: number;
        total: number;
        on_credit: number;
        discounts: number;
        voided_count: number;
        voided_total: number;
    };
};

const differenceText = (d: number | null) =>
    d === null
        ? '—'
        : d === 0
          ? 'Cuadrado'
          : `${d < 0 ? 'Faltante' : 'Sobrante'} ${formatMoney(Math.abs(d))}`;

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
            <span
                className={
                    strong ? 'font-semibold text-text-heading' : 'text-muted'
                }
            >
                {label}
            </span>
            <span
                className={cn(
                    'tabular-nums',
                    strong && 'font-semibold text-text-heading',
                )}
            >
                {value}
            </span>
        </div>
    );
}

const h2 = 'mb-2 mt-6 text-[13px] font-semibold text-text-heading';
const th =
    'border-b border-divider px-1 py-1 text-left text-[9.5px] font-semibold text-table-header-text uppercase';
const td = 'border-b border-divider px-1 py-1 align-top';

/** Cuadre de caja of a day, to print: every shift, totals and receipts */
export default function ReporteDia({
    day,
    clinic,
    printed_by,
    printed_at,
}: {
    day: CashDay;
    clinic: ClinicInfo;
    printed_by?: string | null;
    printed_at?: string | null;
}) {
    const t = day.totals;

    return (
        <>
            {/* Print CSS: hide app chrome */}
            <style>{`@media print { body > *:not(#app) { display: none !important; } #app > *:not(.printable-root) { display: none !important; } }`}</style>
            <div className="printable-root min-h-screen bg-surface py-8 print:min-h-0 print:bg-white print:p-0 print:py-0">
                <div className="mx-auto mb-4 flex w-full max-w-[816px] print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary px-[14px] text-sm font-medium text-white hover:bg-primary-hover"
                    >
                        Imprimir
                    </button>
                </div>
                <PrintablePage showHeader={false}>
                    <div className="mb-5 flex items-start justify-between border-b border-divider pb-4">
                        <div>
                            <ClinicHeader clinic={clinic} />
                            <h1 className="mt-2 mb-0 text-[15px] font-semibold text-text-heading">
                                Cuadre de caja del día
                            </h1>
                            <div className="text-[13px] text-text-secondary first-letter:uppercase">
                                {day.label}
                            </div>
                        </div>
                        {printed_at && (
                            <div className="text-right text-[12px] text-muted">
                                Impreso el {printed_at}
                                {printed_by && <div>por {printed_by}</div>}
                            </div>
                        )}
                    </div>

                    {day.open_shifts > 0 && (
                        <p className="mb-4 rounded-md border border-error-border bg-error-bg px-3 py-2 text-[12.5px] text-error">
                            {day.open_shifts === 1
                                ? 'Hay 1 turno abierto: sus cifras son parciales.'
                                : `Hay ${day.open_shifts} turnos abiertos: sus cifras son parciales.`}
                        </p>
                    )}

                    {day.shifts.length === 0 ? (
                        <p className="text-[13px] text-muted">
                            No se abrió la caja este día.
                        </p>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-8">
                                <section aria-label="Cobrado">
                                    <h2 className="mt-0 mb-1 text-[13px] font-semibold text-text-heading">
                                        Cobrado
                                    </h2>
                                    <Row
                                        label="Efectivo"
                                        value={formatMoney(t.income.efectivo)}
                                    />
                                    <Row
                                        label="Tarjeta"
                                        value={formatMoney(t.income.tarjeta)}
                                    />
                                    <Row
                                        label="Transferencia"
                                        value={formatMoney(
                                            t.income.transferencia,
                                        )}
                                    />
                                    <Row
                                        label="Total cobrado"
                                        value={formatMoney(t.collected)}
                                        strong
                                    />
                                </section>
                                <section aria-label="Efectivo en caja">
                                    <h2 className="mt-0 mb-1 text-[13px] font-semibold text-text-heading">
                                        Efectivo en caja
                                    </h2>
                                    <Row
                                        label="Fondos de apertura"
                                        value={formatMoney(t.opening)}
                                    />
                                    <Row
                                        label="Cobros en efectivo"
                                        value={formatMoney(t.income.efectivo)}
                                    />
                                    <Row
                                        label="Retiros"
                                        value={`−${formatMoney(t.withdrawals)}`}
                                    />
                                    <Row
                                        label="Efectivo esperado"
                                        value={formatMoney(t.expected_cash)}
                                        strong
                                    />
                                    <Row
                                        label="Efectivo contado (turnos cerrados)"
                                        value={
                                            t.counted_cash === null
                                                ? '—'
                                                : formatMoney(t.counted_cash)
                                        }
                                    />
                                    <Row
                                        label="Diferencia"
                                        value={differenceText(t.difference)}
                                        strong
                                    />
                                </section>
                            </div>

                            <section aria-label="Facturación del día">
                                <h2 className={h2}>Facturación del día</h2>
                                <Row
                                    label={`Facturas emitidas (${day.billing.count})`}
                                    value={formatMoney(day.billing.total)}
                                />
                                <Row
                                    label="De ellas, a crédito"
                                    value={formatMoney(day.billing.on_credit)}
                                />
                                {day.billing.discounts > 0 && (
                                    <Row
                                        label="Descuentos aplicados"
                                        value={formatMoney(
                                            day.billing.discounts,
                                        )}
                                    />
                                )}
                                <Row
                                    label={`Facturas anuladas (${day.billing.voided_count})`}
                                    value={formatMoney(
                                        day.billing.voided_total,
                                    )}
                                />
                            </section>

                            <section aria-label="Turnos">
                                <h2 className={h2}>Turnos</h2>
                                <table className="w-full border-collapse text-[11px] tabular-nums">
                                    <thead>
                                        <tr>
                                            <th className={th}>Turno</th>
                                            <th className={th}>
                                                Apertura / cierre
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Fondo
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Efectivo
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Tarjeta
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Transf.
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Retiros
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Esperado
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Contado
                                            </th>
                                            <th
                                                className={cn(th, 'text-right')}
                                            >
                                                Diferencia
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {day.shifts.map((s) => (
                                            <tr key={s.id}>
                                                <td className={td}>
                                                    <div className="font-semibold">
                                                        {s.label}
                                                    </div>
                                                    <div className="text-muted">
                                                        {s.opened_by}
                                                    </div>
                                                </td>
                                                <td className={td}>
                                                    <div>{s.opened_at}</div>
                                                    <div className="text-muted">
                                                        {s.status === 'cerrado'
                                                            ? `${s.closed_at} · ${s.closed_by}`
                                                            : 'Abierto'}
                                                    </div>
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {formatMoney(
                                                        s.summary.opening,
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {formatMoney(
                                                        s.summary.income
                                                            .efectivo,
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {formatMoney(
                                                        s.summary.income
                                                            .tarjeta,
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {formatMoney(
                                                        s.summary.income
                                                            .transferencia,
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {formatMoney(
                                                        s.summary.withdrawals,
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {formatMoney(
                                                        s.expected_cash,
                                                    )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {s.counted_cash === null
                                                        ? '—'
                                                        : formatMoney(
                                                              s.counted_cash,
                                                          )}
                                                </td>
                                                <td
                                                    className={cn(
                                                        td,
                                                        'text-right',
                                                    )}
                                                >
                                                    {differenceText(
                                                        s.difference,
                                                    )}
                                                    {s.close_note && (
                                                        <div className="text-muted">
                                                            {s.close_note}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>

                            <section aria-label="Recibos">
                                <h2 className={h2}>
                                    Recibos ({day.receipts.length})
                                </h2>
                                {day.receipts.length === 0 ? (
                                    <p className="text-[12.5px] text-muted">
                                        Sin cobros.
                                    </p>
                                ) : (
                                    <table className="w-full border-collapse text-[11.5px] tabular-nums">
                                        <thead>
                                            <tr>
                                                <th className={th}>Hora</th>
                                                <th className={th}>Recibo</th>
                                                <th className={th}>Factura</th>
                                                <th className={th}>Paciente</th>
                                                <th className={th}>
                                                    Forma de pago
                                                </th>
                                                <th
                                                    className={cn(
                                                        th,
                                                        'text-right',
                                                    )}
                                                >
                                                    Monto
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {day.receipts.map((r) => (
                                                <tr key={r.id}>
                                                    <td className={td}>
                                                        {r.time}
                                                        <div className="text-muted">
                                                            {r.shift}
                                                        </div>
                                                    </td>
                                                    <td className={td}>
                                                        {r.number}
                                                    </td>
                                                    <td className={td}>
                                                        {r.invoice_number}
                                                    </td>
                                                    <td className={td}>
                                                        {r.patient}
                                                    </td>
                                                    <td
                                                        className={cn(
                                                            td,
                                                            'text-muted',
                                                        )}
                                                    >
                                                        {r.voided
                                                            ? `Anulado: ${r.void_reason}`
                                                            : r.payments
                                                                  .map(
                                                                      paymentLabel,
                                                                  )
                                                                  .join(' + ')}
                                                    </td>
                                                    <td
                                                        className={cn(
                                                            td,
                                                            'text-right',
                                                            r.voided &&
                                                                'text-muted line-through',
                                                        )}
                                                    >
                                                        {formatMoney(r.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </section>

                            <section
                                aria-label="Retiros"
                                className="break-inside-avoid"
                            >
                                <h2 className={h2}>Retiros</h2>
                                {day.withdrawals.length === 0 ? (
                                    <p className="text-[12.5px] text-muted">
                                        Sin retiros.
                                    </p>
                                ) : (
                                    <ul className="m-0 list-none p-0 text-[12.5px]">
                                        {day.withdrawals.map((w) => (
                                            <li
                                                key={w.id}
                                                className="flex justify-between border-b border-divider py-1"
                                            >
                                                <span>
                                                    {w.time} · {w.shift} ·{' '}
                                                    {w.reason} ({w.created_by})
                                                </span>
                                                <span className="tabular-nums">
                                                    {formatMoney(w.amount)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </>
                    )}

                    <div className="mt-14 flex break-inside-avoid justify-around text-center text-[12px] text-muted print:break-before-avoid">
                        <div className="w-48 border-t border-text-heading pt-1">
                            Entregado por (cajero)
                        </div>
                        <div className="w-48 border-t border-text-heading pt-1">
                            Recibido por (supervisor)
                        </div>
                    </div>
                </PrintablePage>
            </div>
        </>
    );
}
