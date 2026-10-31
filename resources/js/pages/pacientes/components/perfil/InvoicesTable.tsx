import React from 'react';
import { usePage } from '@inertiajs/react';
import PayInvoiceButton from '@/components/caja/PayInvoiceButton';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { formatMoney } from '@/lib/money';
import type { Finanzas, ProfileInvoice } from './types';

type BadgeState = React.ComponentProps<typeof StatusBadge>['state'];

const STATUS: Record<
    ProfileInvoice['status'],
    { label: string; state: BadgeState }
> = {
    pendiente: { label: 'Con balance', state: 'balance' },
    pagada: { label: 'Saldada', state: 'saldada' },
    anulada: { label: 'Anulada', state: 'cancelada' },
};

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** Facturas of the patient with their balance and «Registrar pago» */
export default function InvoicesTable({
    finanzas,
    patientName,
}: {
    finanzas: Finanzas;
    patientName: string;
}) {
    const permissions =
        (usePage().props as unknown as { permissions?: string[] })
            .permissions ?? [];
    const canCollect = permissions.includes('module.caja.access');

    return (
        <section className="overflow-x-auto rounded-2xl border border-card-border bg-white">
            <h2 className="m-0 border-b border-divider px-5 py-3 font-serif text-[16px] font-semibold text-text-heading">
                Facturas
            </h2>
            {finanzas.facturas.length === 0 ? (
                <p className="p-8 text-center text-muted">No tiene facturas.</p>
            ) : (
                <table className="w-full min-w-[640px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Factura</th>
                            <th className={`${th} text-right`}>Total</th>
                            <th className={`${th} text-right`}>Pagado</th>
                            <th className={`${th} text-right`}>Balance</th>
                            <th className={`${th} text-left`}>Estado</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {finanzas.facturas.map((f) => (
                            <tr key={f.id}>
                                <td className={`${td} pl-5`}>
                                    <div className="font-mono font-semibold text-text-heading">
                                        {f.number}
                                    </div>
                                    <div className="text-[12.5px] text-text-tertiary tabular-nums">
                                        {f.issued_on}
                                    </div>
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {formatMoney(f.total)}
                                </td>
                                <td
                                    className={`${td} text-right text-text-secondary tabular-nums`}
                                >
                                    {formatMoney(f.paid_amount)}
                                </td>
                                <td
                                    className={`${td} text-right font-semibold text-text-heading tabular-nums`}
                                >
                                    {formatMoney(f.balance)}
                                </td>
                                <td className={td}>
                                    <StatusBadge
                                        state={STATUS[f.status].state}
                                        label={STATUS[f.status].label}
                                    />
                                </td>
                                <td className={`${td} pr-5 text-right`}>
                                    {canCollect && f.balance > 0 && (
                                        <PayInvoiceButton
                                            invoice={{
                                                id: f.id,
                                                number: f.number,
                                                balance: f.balance,
                                                credit_due_date:
                                                    f.credit_due_date,
                                                patient_name: patientName,
                                            }}
                                        />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            <div className="flex flex-wrap justify-end gap-6 border-t border-divider bg-list-row-bg px-5 py-3 text-text-secondary tabular-nums">
                <span>
                    Facturado{' '}
                    <strong className="text-text-heading">
                        {formatMoney(finanzas.total_facturado)}
                    </strong>
                </span>
                <span>
                    Pagado{' '}
                    <strong className="text-text-heading">
                        {formatMoney(finanzas.total_pagado)}
                    </strong>
                </span>
                <span>
                    Saldo{' '}
                    <strong className="text-text-heading">
                        {formatMoney(finanzas.saldo)}
                    </strong>
                </span>
            </div>
        </section>
    );
}
