import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import LabStatusPill from '@/components/lab/LabStatusPill';
import { LAB_STATUS } from '@/components/lab/types';
import type { LabOrderStatus } from '@/components/lab/types';
import { ageLabel } from '@/lib/patient';
import * as orders from '@/routes/lab/orders';
import type { LabRow } from '../types';
import QuickAction from './QuickAction';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';
const FLOW: LabOrderStatus[] = [
    'ordenada',
    'muestra',
    'ingresado',
    'validada',
    'entregada',
];

/** «Hoy»: orders by status, oldest step first */
export default function LabQueue({
    rows,
    counts,
}: {
    rows: LabRow[];
    counts: Record<string, number>;
}) {
    const [tab, setTab] = useState<'todas' | LabOrderStatus>('todas');
    const visible = rows
        .filter((o) =>
            tab === 'todas' ? o.status !== 'cancelada' : o.status === tab,
        )
        .sort(
            (a, b) =>
                FLOW.indexOf(a.status) - FLOW.indexOf(b.status) ||
                a.ordered_at.localeCompare(b.ordered_at),
        );
    const active = rows.filter((o) => o.status !== 'cancelada').length;

    return (
        <div className="flex flex-col gap-3">
            <p className="m-0 text-text-secondary">
                {active} {active === 1 ? 'orden' : 'órdenes'} ·{' '}
                {counts.ordenada ?? 0} por tomar muestra ·{' '}
                {(counts.muestra ?? 0) + (counts.ingresado ?? 0)} por resultado
                o validación · {counts.validada ?? 0} por entregar
            </p>
            <SegmentedControl<'todas' | LabOrderStatus>
                segments={[
                    { value: 'todas', label: 'Todas', count: active },
                    ...FLOW.map((s) => ({
                        value: s,
                        label: LAB_STATUS[s].label,
                        count: counts[s] ?? 0,
                    })),
                ]}
                value={tab}
                onChange={setTab}
                className="self-start"
            />
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
                <table className="w-full min-w-[980px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Orden</th>
                            <th className={`${th} text-left`}>Paciente</th>
                            <th className={`${th} text-left`}>Médico</th>
                            <th className={`${th} text-left`}>Origen</th>
                            <th className={`${th} text-left`}>Pruebas</th>
                            <th className={`${th} text-left`}>Estado</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((o) => (
                            <tr
                                key={o.id}
                                onClick={() =>
                                    router.visit(orders.show.url(o.id))
                                }
                                className="cursor-pointer hover:bg-list-row-bg"
                            >
                                <td className={`${td} pl-5`}>
                                    <div className="font-mono font-semibold whitespace-nowrap">
                                        {o.number}
                                    </div>
                                    <div className="text-[12.5px] text-muted tabular-nums">
                                        {o.ordered_time}
                                    </div>
                                </td>
                                <td className={td}>
                                    <div className="font-medium text-text-heading">
                                        {o.patient.full_name}
                                    </div>
                                    <div className="text-[12.5px] text-text-tertiary">
                                        {[
                                            ageLabel(o.patient.age),
                                            o.patient.sex,
                                            o.patient.document_number,
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                </td>
                                <td className={`${td} text-[13px]`}>
                                    {o.doctor ?? '—'}
                                </td>
                                <td className={td}>{o.origin}</td>
                                <td className={td}>
                                    <div className="flex flex-wrap gap-1">
                                        {o.tests.map((t) => (
                                            <span
                                                key={t}
                                                className="rounded-md bg-list-row-bg px-2 py-0.5 text-[12px]"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className={td}>
                                    <LabStatusPill status={o.status} />
                                </td>
                                <td className={`${td} pr-5`}>
                                    <QuickAction order={o} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {visible.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        No hay órdenes en este estado.
                    </div>
                )}
            </section>
        </div>
    );
}
