import React from 'react';
import { router } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { ageLabel } from '@/lib/patient';
import { cn } from '@/lib/utils';
import emergenciaRoutes from '@/routes/emergencia';
import type { EmergencyRow } from '../types';
import { elapsed } from '../types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** Paciente · Ubicación · Llegada · Tiempo · Médico; a row opens the detail */
export default function EmergencyTable({
    rows,
    now,
}: {
    rows: EmergencyRow[];
    now: number;
}) {
    const open = (id: number) => router.visit(emergenciaRoutes.show.url(id));

    return (
        <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
                <tr>
                    <th className={`${th} pl-5 text-left`}>Paciente</th>
                    <th className={`${th} text-left`}>Ubicación</th>
                    <th className={`${th} text-left`}>Llegada</th>
                    <th className={`${th} text-left`}>Tiempo</th>
                    <th className={`${th} text-left`}>Médico</th>
                    <th className={`${th} pr-5`}>
                        <span className="sr-only">Abrir</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((e) => {
                    const p = e.patient;
                    const meta = [ageLabel(p.age), p.sex, p.document_number]
                        .filter(Boolean)
                        .join(' · ');
                    const minutes =
                        (now - new Date(e.arrived_at).getTime()) / 60000;
                    return (
                        <tr
                            key={e.id}
                            onClick={() => open(e.id)}
                            className="cursor-pointer hover:bg-list-row-bg"
                        >
                            <td className={`${td} pl-5`}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-text-heading">
                                        {p.full_name}
                                    </span>
                                    {p.profile_incomplete && (
                                        <span className="state-espera rounded-full bg-[var(--state-bg)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--state-text)]">
                                            Perfil incompleto
                                        </span>
                                    )}
                                </div>
                                <div className="text-[12.5px] text-text-tertiary">
                                    {meta}
                                </div>
                                <div className="text-[13px] text-text-secondary">
                                    {e.reason}
                                </div>
                            </td>
                            <td className={td}>{e.cubicle.name}</td>
                            <td className={`${td} tabular-nums`}>
                                {e.arrived_time}
                            </td>
                            <td
                                className={cn(
                                    td,
                                    'font-semibold tabular-nums',
                                    minutes >= 60
                                        ? 'text-error'
                                        : minutes >= 30
                                          ? 'state-espera text-[var(--state-text)]'
                                          : 'text-primary',
                                )}
                            >
                                {elapsed(e.arrived_at, now)}
                            </td>
                            <td className={td}>{e.doctor}</td>
                            <td className={`${td} pr-5 text-right text-muted`}>
                                <ChevronRight className="inline h-4 w-4" />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
