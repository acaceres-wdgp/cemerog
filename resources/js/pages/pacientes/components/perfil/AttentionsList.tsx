import React from 'react';
import { Link } from '@inertiajs/react';
import StatusBadge from '@/components/cemerog/StatusBadge';
import type { Attention, PaginatedAttentions } from './types';

type BadgeState = React.ComponentProps<typeof StatusBadge>['state'];

const STATUS_BADGE: Record<string, BadgeState> = {
    espera: 'espera',
    en_consulta: 'consulta',
    atendido: 'cita-atendida',
    no_asistio: 'cancelada',
};

const DISCHARGE_LABELS: Record<string, string> = {
    recuperado: 'Alta por alivio',
    traslado: 'Traslado',
    defuncion: 'Defunción',
};

function AttentionRow({ a }: { a: Attention }) {
    return (
        <li className="flex flex-wrap items-start gap-3 border-b border-divider px-5 py-3 last:border-b-0">
            <div className="w-[88px] shrink-0 text-[12px] text-muted tabular-nums">
                <div className="font-semibold text-text-body">{a.date}</div>
                T-{String(a.turn_number).padStart(2, '0')}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-badge-consulta-bg px-[10px] py-[2px] text-[12px] font-semibold text-consulta-num">
                        {a.type}
                    </span>
                    <StatusBadge
                        state={STATUS_BADGE[a.status] ?? 'cancelada'}
                        label={a.status_label}
                    />
                    <span className="text-[12px] text-muted">
                        {a.doctor} · {a.specialty}
                    </span>
                </div>
                {a.diagnostico && (
                    <p className="mt-1 text-[13.5px] font-semibold text-text-heading">
                        {a.diagnostico}
                    </p>
                )}
                {a.motivo && (
                    <p className="text-[13px] text-text-body">{a.motivo}</p>
                )}
                {a.discharge && (
                    <p className="mt-1 text-[12px] text-muted">
                        {DISCHARGE_LABELS[a.discharge.type] ?? a.discharge.type}
                        : {a.discharge.discharge_diagnosis}
                    </p>
                )}
            </div>
        </li>
    );
}

export default function AttentionsList({
    attentions,
    pagination,
}: {
    attentions: Attention[];
    /** Present on the full list; omitted on the summary */
    pagination?: PaginatedAttentions;
}) {
    if (attentions.length === 0) {
        return (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
                Este paciente todavía no tiene atenciones.
            </p>
        );
    }

    return (
        <>
            <ul className="m-0 list-none p-0">
                {attentions.map((a) => (
                    <AttentionRow key={a.id} a={a} />
                ))}
            </ul>
            {pagination && pagination.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-divider px-5 py-3 text-[13px] text-muted">
                    <span>
                        Página {pagination.current_page} de{' '}
                        {pagination.last_page} · {pagination.total} atenciones
                    </span>
                    <div className="flex gap-2">
                        {pagination.prev_page_url && (
                            <Link
                                href={pagination.prev_page_url}
                                preserveScroll
                                className="rounded-lg border border-card-border bg-white px-3 py-1 text-text-body"
                            >
                                Anterior
                            </Link>
                        )}
                        {pagination.next_page_url && (
                            <Link
                                href={pagination.next_page_url}
                                preserveScroll
                                className="rounded-lg border border-card-border bg-white px-3 py-1 text-text-body"
                            >
                                Siguiente
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
