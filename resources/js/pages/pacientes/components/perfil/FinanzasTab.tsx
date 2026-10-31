import React from 'react';
import { TriangleAlert } from 'lucide-react';
import ReceiptReadyBanner from '@/components/caja/ReceiptReadyBanner';
import EmptyState from '@/components/cemerog/EmptyState';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { formatMoney } from '@/lib/money';
import InvoicesTable from './InvoicesTable';
import PaymentsTable from './PaymentsTable';
import { ACCOUNT_STATUS_LABELS } from './types';
import type { AccountStatus, Finanzas } from './types';

type BadgeState = React.ComponentProps<typeof StatusBadge>['state'];

const ACCOUNT_BADGE: Record<AccountStatus, BadgeState> = {
    abierta: 'balance',
    pendiente_facturar: 'pendiente',
    facturada: 'saldada',
    anulada: 'cancelada',
};

const thCls =
    'px-4 py-2 text-left text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase';

export default function FinanzasTab({
    finanzas,
    patientName,
}: {
    finanzas: Finanzas;
    patientName: string;
}) {
    return (
        <div className="flex flex-col gap-4">
            <ReceiptReadyBanner />
            {finanzas.pendiente_facturar > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    <span>
                        Este paciente tiene{' '}
                        <strong>
                            {formatMoney(finanzas.pendiente_facturar)}
                        </strong>{' '}
                        pendientes de facturar.
                    </span>
                </div>
            )}

            {finanzas.saldo > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error-strong">
                    <TriangleAlert className="h-4 w-4 shrink-0" />
                    <span>
                        El paciente adeuda{' '}
                        <strong>{formatMoney(finanzas.saldo)}</strong>. Cobra
                        los balances desde la tabla de facturas.
                    </span>
                </div>
            )}

            <InvoicesTable finanzas={finanzas} patientName={patientName} />
            <PaymentsTable pagos={finanzas.pagos} />

            <section className="rounded-2xl border border-card-border bg-white">
                <h2 className="m-0 border-b border-divider px-5 py-3 font-serif text-[16px] font-semibold text-text-heading">
                    Cuentas por día
                </h2>
                {finanzas.cuentas.length === 0 ? (
                    <EmptyState
                        title="Sin cuentas"
                        description="Las cuentas se abren al registrar una atención."
                        className="py-6"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] border-collapse text-[13px]">
                            <thead className="bg-app-bg">
                                <tr>
                                    <th className={thCls}>Fecha</th>
                                    <th className={thCls}>Cargos</th>
                                    <th className={thCls}>Estado</th>
                                    <th className={`${thCls} text-right`}>
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {finanzas.cuentas.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-t border-divider align-top"
                                    >
                                        <td className="px-4 py-3 text-text-body tabular-nums">
                                            {c.service_date}
                                        </td>
                                        <td className="px-4 py-3">
                                            <ul className="m-0 list-none p-0">
                                                {c.charges.map((ch) => (
                                                    <li
                                                        key={ch.id}
                                                        className="text-text-body"
                                                    >
                                                        {ch.quantity} ×{' '}
                                                        {ch.description}{' '}
                                                        <span className="text-muted">
                                                            ·{' '}
                                                            {formatMoney(
                                                                ch.total,
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge
                                                state={ACCOUNT_BADGE[c.status]}
                                                label={
                                                    ACCOUNT_STATUS_LABELS[
                                                        c.status
                                                    ]
                                                }
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-text-heading tabular-nums">
                                            {formatMoney(c.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-divider bg-app-bg">
                                    <td
                                        colSpan={3}
                                        className="px-4 py-2 text-right text-muted"
                                    >
                                        Total cargado (sin anuladas)
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold text-text-heading tabular-nums">
                                        {formatMoney(finanzas.total_cargado)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
