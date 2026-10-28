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
            <div
                style={{
                    padding: '16px 20px',
                    color: '#71717a',
                    fontSize: 13.5,
                    textAlign: 'center',
                }}
            >
                No hay pacientes en turno hoy.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {all.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onSelect(t)}
                    style={{
                        textAlign: 'left',
                        border: 'none',
                        borderBottom: '1px solid #f4f4f5',
                        background: t.id === activeTurnId ? '#F8FBF6' : '#fff',
                        cursor: 'pointer',
                        padding: '10px 20px',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#EEF6E2',
                            color: '#2E8B3E',
                            fontWeight: 700,
                            fontSize: 13,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        T-{String(t.turn_number).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontWeight: 600,
                                fontSize: 13.5,
                                color: '#1f2d22',
                            }}
                        >
                            {t.patient.full_name}
                        </div>
                        <div style={{ fontSize: 12, color: '#71717a' }}>
                            {t.doctor.full_name} · {t.doctor.specialty}
                        </div>
                    </div>
                    <span
                        style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 11.5,
                            fontWeight: 600,
                            background:
                                t.status === 'en_consulta'
                                    ? '#DBEAFE'
                                    : '#F3F7F2',
                            color:
                                t.status === 'en_consulta'
                                    ? '#1E40AF'
                                    : '#52605a',
                        }}
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
