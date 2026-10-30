import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DischargeInfo, HistorialEntry } from '../types';

// ─── Discharge Badge ──────────────────────────────────────────────────────────

const DISCHARGE_LABELS: Record<
    NonNullable<DischargeInfo>['type'],
    { label: string; className: string }
> = {
    recuperado: {
        label: 'Por alivio',
        className: 'bg-badge-consulta-bg text-consulta-num',
    },
    traslado: {
        label: 'Traslado',
        className: 'bg-surface text-secondary-fg',
    },
    defuncion: {
        label: 'Defunción',
        className: 'bg-error-bg text-error',
    },
};

export function DischargeBadge({
    discharge,
}: {
    discharge: NonNullable<DischargeInfo>;
}) {
    const cfg = DISCHARGE_LABELS[discharge.type];
    return (
        <span
            className={cn(
                'rounded-full px-2 py-[1px] text-[11px] font-semibold',
                cfg.className,
            )}
        >
            {cfg.label}
        </span>
    );
}

// ─── HistorialList ────────────────────────────────────────────────────────────

type Props = {
    historial: HistorialEntry[];
    selId: number | null;
    onSelect: (id: number) => void;
};

export default function HistorialList({ historial, selId, onSelect }: Props) {
    return (
        <div className="max-h-[400px] min-w-0 flex-[1_1_320px] overflow-y-auto border-r border-divider">
            {historial.map((e) => {
                const dx0 = e.diagnosticos?.[0];
                const dateStr = format(new Date(e.consulted_at), 'dd/MM/yyyy', {
                    locale: es,
                });
                return (
                    <button
                        key={e.id}
                        onClick={() => onSelect(e.id)}
                        className={cn(
                            'flex w-full cursor-pointer items-start gap-3 border-0 border-b border-row-separator px-5 py-3 text-left',
                            e.id === selId ? 'bg-list-row-bg' : 'bg-white',
                        )}
                    >
                        <span className="w-[3px] shrink-0 self-stretch rounded-sm bg-consulta-dot" />
                        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                                <span className="rounded-full bg-badge-consulta-bg px-2 py-[1px] font-semibold text-consulta-num">
                                    Consulta
                                </span>
                                {e.discharge && (
                                    <DischargeBadge discharge={e.discharge} />
                                )}
                                <span className="text-muted tabular-nums">
                                    {dateStr}
                                </span>
                            </div>
                            <div className="text-[13.5px] font-semibold text-text-heading">
                                {dx0
                                    ? `${dx0.code} – ${dx0.label}`
                                    : (e.motivo_consulta ?? 'Sin diagnóstico')}
                            </div>
                            <div className="text-[12px] text-muted">
                                {e.doctor.full_name} ·{' '}
                                {e.doctor.specialty ?? ''}
                            </div>
                        </div>
                        <span className="mt-[2px] shrink-0 text-[15px] text-muted-light">
                            ›
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
