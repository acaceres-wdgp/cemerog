import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { initials } from '../lib/helpers';
import { TurnItem } from '../types';

// ─── Patient Header ───────────────────────────────────────────────────────────

export default function PatientHeader({ turn }: { turn: TurnItem }) {
    const p = turn.patient;
    const d = turn.doctor;
    const arrivedAt = new Date(turn.arrived_at);

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #e3e9e3',
                borderRadius: 16,
                boxShadow: '0 10px 24px -16px rgba(16,40,24,.25)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    flexWrap: 'wrap',
                }}
            >
                <div
                    style={{
                        width: 52,
                        height: 52,
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: '#2E8B3E',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 17,
                        boxShadow: '0 0 0 4px #EEF6E2',
                    }}
                >
                    {initials(p.full_name)}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: 'Bitter,Georgia,serif',
                                fontWeight: 600,
                                fontSize: 21,
                                color: '#1f2d22',
                            }}
                        >
                            {p.full_name}
                        </span>
                        <StatusBadge state="consulta" />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: 6,
                            flexWrap: 'wrap',
                            marginTop: 6,
                        }}
                    >
                        {[
                            `${p.age} años`,
                            p.sex === 'M' ? 'Masculino' : 'Femenino',
                        ].map((v) => (
                            <span
                                key={v}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    height: 24,
                                    padding: '0 10px',
                                    borderRadius: 999,
                                    background: '#f3f5f1',
                                    fontSize: 12.5,
                                    color: '#3f3f46',
                                }}
                            >
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
                {p.allergies && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 16px 8px 8px',
                            borderRadius: 12,
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                        }}
                    >
                        <span
                            style={{
                                width: 34,
                                height: 34,
                                flexShrink: 0,
                                borderRadius: 10,
                                background: '#dc2626',
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 17,
                            }}
                        >
                            ⚠
                        </span>
                        <div style={{ lineHeight: 1.25 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '.05em',
                                }}
                            >
                                Alergias
                            </div>
                            <div style={{ fontWeight: 600 }}>{p.allergies}</div>
                        </div>
                    </div>
                )}
            </div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    borderTop: '1px solid #eef0ec',
                    background: '#fafbf8',
                }}
            >
                {[
                    {
                        label: 'No. de turno',
                        val: `T-${String(turn.turn_number).padStart(2, '0')}`,
                    },
                    { label: 'Área', val: 'Consulta' },
                    { label: 'Médico', val: d.full_name },
                    {
                        label: 'Llegada',
                        val: format(arrivedAt, 'HH:mm', { locale: es }),
                    },
                ].map((f) => (
                    <div
                        key={f.label}
                        style={{
                            flex: '1 1 0',
                            padding: '10px 20px',
                            borderRight: '1px solid #eef0ec',
                            minWidth: 0,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#71717a',
                                textTransform: 'uppercase',
                                letterSpacing: '.05em',
                            }}
                        >
                            {f.label}
                        </div>
                        <div
                            style={{
                                fontWeight: 600,
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {f.val}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
