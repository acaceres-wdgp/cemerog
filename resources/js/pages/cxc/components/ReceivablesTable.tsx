import React from 'react';
import { Link } from '@inertiajs/react';
import PayInvoiceButton from '@/components/caja/PayInvoiceButton';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import pacientes from '@/routes/pacientes';
import type { ReceivableRow } from '../types';
import { AGES, bucketOf } from './aging';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** Factura · Paciente · Días · Total · Abonado · Balance · Antigüedad */
export default function ReceivablesTable({ rows }: { rows: ReceivableRow[] }) {
    return (
        <table className="w-full min-w-[900px] border-collapse text-[14px]">
            <thead>
                <tr>
                    <th className={`${th} pl-5 text-left`}>Factura</th>
                    <th className={`${th} text-left`}>Paciente</th>
                    <th className={`${th} text-right`}>Días</th>
                    <th className={`${th} text-right`}>Total</th>
                    <th className={`${th} text-right`}>Abonado</th>
                    <th className={`${th} text-right`}>Balance</th>
                    <th className={`${th} text-left`}>Antigüedad</th>
                    <th className={`${th} pr-5`}>
                        <span className="sr-only">Acciones</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => {
                    const age = AGES[bucketOf(r.days)];
                    return (
                        <tr key={r.id} className="hover:bg-list-row-bg">
                            <td className={`${td} pl-5`}>
                                <div className="font-mono font-semibold text-text-heading">
                                    {r.number}
                                </div>
                                <div className="text-[12.5px] text-text-tertiary tabular-nums">
                                    {r.issued_on}
                                </div>
                            </td>
                            <td className={td}>
                                <Link
                                    href={pacientes.show.url(r.patient.id, {
                                        query: { tab: 'finanzas' },
                                    })}
                                    className="font-semibold text-text-heading hover:text-primary"
                                >
                                    {r.patient.full_name}
                                </Link>
                                <div className="text-[12.5px] text-text-tertiary tabular-nums">
                                    {[
                                        r.patient.document_number,
                                        r.patient.phone,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </div>
                            </td>
                            <td className={`${td} text-right tabular-nums`}>
                                {r.days}
                            </td>
                            <td className={`${td} text-right tabular-nums`}>
                                {formatMoney(r.total)}
                            </td>
                            <td
                                className={`${td} text-right text-text-secondary tabular-nums`}
                            >
                                {formatMoney(r.paid_amount)}
                            </td>
                            <td
                                className={`${td} text-right font-bold text-text-heading tabular-nums`}
                            >
                                {formatMoney(r.balance)}
                            </td>
                            <td className={td}>
                                <span
                                    className={cn(
                                        'inline-flex rounded-full px-[10px] py-[3px] text-[12.5px] font-medium whitespace-nowrap',
                                        age.pill,
                                    )}
                                >
                                    {age.label}
                                </span>
                                {r.overdue && (
                                    <div className="mt-1 text-[12px] text-error">
                                        Compromiso vencido {r.credit_due_date}
                                    </div>
                                )}
                            </td>
                            <td className={`${td} pr-5 text-right`}>
                                <PayInvoiceButton
                                    invoice={{
                                        id: r.id,
                                        number: r.number,
                                        balance: r.balance,
                                        credit_due_date: r.credit_due_date,
                                        patient_name: r.patient.full_name,
                                    }}
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
