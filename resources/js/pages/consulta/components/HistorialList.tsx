import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClinicalEntry } from '../types';

// ─── Entry type chip config ───────────────────────────────────────────────────

const TYPE_CHIP: Record<
    ClinicalEntry['type'],
    { label: string; dotClass: string; chipClass: string }
> = {
    consulta: {
        label: 'Consulta',
        dotClass: 'bg-consulta-dot',
        chipClass: 'bg-badge-consulta-bg text-consulta-num',
    },
    receta: {
        label: 'Receta',
        dotClass: 'bg-accent',
        chipClass: 'bg-accent-bg text-primary',
    },
    alta: {
        label: 'Alta',
        dotClass: 'bg-secondary-fg',
        chipClass: 'bg-surface text-secondary-fg',
    },
    laboratorio: {
        label: 'Laboratorio',
        dotClass: 'bg-muted',
        chipClass: 'bg-surface text-muted',
    },
    imagen: {
        label: 'Imagen',
        dotClass: 'bg-muted',
        chipClass: 'bg-surface text-muted',
    },
};

// ─── HistorialList ────────────────────────────────────────────────────────────

type Props = {
    historial: ClinicalEntry[];
    selIdx: number | null;
    onSelect: (idx: number) => void;
};

export default function HistorialList({ historial, selIdx, onSelect }: Props) {
    return (
        <div className="max-h-[400px] min-w-0 flex-[1_1_320px] overflow-y-auto border-r border-divider">
            {historial.map((e, i) => {
                const cfg = TYPE_CHIP[e.type] ?? TYPE_CHIP.consulta;
                const dateStr = format(new Date(e.date), 'dd/MM/yyyy', {
                    locale: es,
                });
                const dx0 = e.diagnosticos?.[0];
                const title =
                    e.type === 'consulta'
                        ? dx0
                            ? `${dx0.code} – ${dx0.label}`
                            : (e.motivo_consulta ?? 'Sin diagnóstico')
                        : e.type === 'receta'
                          ? (e.prescription?.items?.[0]?.medication ??
                            'Receta médica')
                          : (e.discharge?.discharge_diagnosis ?? 'Alta médica');

                return (
                    <button
                        key={`${e.type}-${i}`}
                        onClick={() => onSelect(i)}
                        className={cn(
                            'flex w-full cursor-pointer items-start gap-3 border-0 border-b border-row-separator px-5 py-3 text-left',
                            i === selIdx ? 'bg-list-row-bg' : 'bg-white',
                        )}
                    >
                        <span
                            className={cn(
                                'w-[3px] shrink-0 self-stretch rounded-sm',
                                cfg.dotClass,
                            )}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-[1px] font-semibold',
                                        cfg.chipClass,
                                    )}
                                >
                                    {cfg.label}
                                </span>
                                <span className="text-muted tabular-nums">
                                    {dateStr}
                                </span>
                            </div>
                            <div className="text-[13.5px] font-semibold text-text-heading">
                                {title}
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
