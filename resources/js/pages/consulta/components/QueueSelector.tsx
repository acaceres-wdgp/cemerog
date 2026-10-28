import React from 'react';
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
                    // dynamic-style: active turn highlight depends on activeTurnId
                    style={{
                        background:
                            t.id === activeTurnId
                                ? 'var(--color-list-row-bg)'
                                : 'var(--color-card-bg)',
                    }}
                    className="flex cursor-pointer items-center gap-3 border-0 border-b border-row-separator px-5 py-[10px] text-left"
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
                    {/* dynamic-style: status-dependent badge colors */}
                    <span
                        // dynamic-style: status-dependent colors
                        style={{
                            background:
                                t.status === 'en_consulta'
                                    ? 'var(--color-badge-consulta-bg)'
                                    : 'var(--color-app-bg)',
                            color:
                                t.status === 'en_consulta'
                                    ? 'var(--color-consulta-num)'
                                    : 'var(--color-secondary-fg)',
                        }}
                        className="rounded-full px-2 py-[2px] text-[11.5px] font-semibold"
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
