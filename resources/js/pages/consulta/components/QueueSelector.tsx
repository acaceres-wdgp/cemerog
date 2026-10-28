import React from 'react';
import { cn } from '@/lib/utils';
import { TurnItem } from '../types';

// ─── Queue Selector ───────────────────────────────────────────────────────────

export default function QueueSelector({
    turnsEspera,
    turnsConsulta,
    activeTurnId,
    onSelect,
}: {
    turnsEspera: TurnItem[];
    turnsConsulta: TurnItem[];
    activeTurnId: number | null;
    onSelect: (turn: TurnItem) => void;
}) {
    const all = [...turnsConsulta, ...turnsEspera];
    if (all.length === 0) {
        return (
            <div className="px-5 py-4 text-center text-[13.5px] text-muted">
                No hay pacientes en turno hoy.
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {all.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    className={cn(
                        'flex cursor-pointer items-center gap-3 border-0 border-b border-row-separator px-5 py-[10px] text-left',
                        t.id === activeTurnId ? 'bg-list-row-bg' : 'bg-white',
                    )}
                >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-bg text-[13px] font-bold text-primary">
                        T-{String(t.turn_number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-text-heading">
                            {t.patient.full_name}
                        </div>
                        <div className="text-[12px] text-muted">
                            {t.doctor.full_name} · {t.doctor.specialty}
                        </div>
                    </div>
                    <span
                        className={cn(
                            'rounded-full px-2 py-[2px] text-[11.5px] font-semibold',
                            t.status === 'en_consulta'
                                ? 'bg-badge-consulta-bg text-consulta-num'
                                : 'bg-app-bg text-secondary-fg',
                        )}
                    >
                        {t.status === 'en_consulta'
                            ? 'En consulta'
                            : 'En espera'}
                    </span>
                </button>
            ))}
        </div>
    );
}
