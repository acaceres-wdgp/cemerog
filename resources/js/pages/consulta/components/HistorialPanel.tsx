import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { HistorialEntry } from '../types';

// ─── Historial Panel ──────────────────────────────────────────────────────────

export default function HistorialPanel({
    historial,
}: {
    historial: HistorialEntry[];
}) {
    const [selId, setSelId] = useState<number | null>(historial[0]?.id ?? null);
    const sel = historial.find((h) => h.id === selId);

    if (historial.length === 0) {
        return (
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    overflow: 'hidden',
                    marginTop: 8,
                }}
            >
                <div
                    style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid #eef0ec',
                    }}
                >
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#1f2d22',
                        }}
                    >
                        Historial en la clínica
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a' }}>
                        0 registros
                    </div>
                </div>
                <div
                    style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        color: '#71717a',
                    }}
                >
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                    <div
                        style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: '#52605a',
                            marginBottom: 4,
                        }}
                    >
                        Sin historial registrado
                    </div>
                    <p style={{ margin: 0, fontSize: 13 }}>
                        Las consultas guardadas de este paciente aparecerán
                        aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid #e3e9e3',
                borderRadius: 14,
                overflow: 'hidden',
                marginTop: 8,
            }}
        >
            <div
                style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #eef0ec',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: 'Bitter,Georgia,serif',
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#1f2d22',
                        }}
                    >
                        Historial en la clínica
                    </div>
                    <div style={{ fontSize: 13, color: '#71717a' }}>
                        {historial.length} registros
                    </div>
                </div>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'stretch',
                }}
            >
                {/* Left list */}
                <div
                    style={{
                        flex: '1 1 320px',
                        minWidth: 0,
                        borderRight: '1px solid #eef0ec',
                        maxHeight: 400,
                        overflowY: 'auto',
                    }}
                >
                    {historial.map((e) => {
                        const dx0 = e.diagnosticos?.[0];
                        const dateStr = format(
                            new Date(e.consulted_at),
                            'dd/MM/yyyy',
                            { locale: es },
                        );
                        return (
                            <button
                                key={e.id}
                                onClick={() =>
                                    setSelId(e.id === selId ? null : e.id)
                                }
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderBottom: '1px solid #f4f4f5',
                                    background:
                                        e.id === selId ? '#F8FBF6' : '#fff',
                                    cursor: 'pointer',
                                    padding: '12px 20px',
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'flex-start',
                                }}
                            >
                                <span
                                    style={{
                                        width: 3,
                                        alignSelf: 'stretch',
                                        borderRadius: 2,
                                        background: '#2563EB',
                                        flexShrink: 0,
                                    }}
                                />
                                <div
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: '4px 8px',
                                            fontSize: 12,
                                        }}
                                    >
                                        <span
                                            style={{
                                                padding: '1px 8px',
                                                borderRadius: 999,
                                                background: '#DBEAFE',
                                                color: '#1E40AF',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Consulta
                                        </span>
                                        <span
                                            style={{
                                                color: '#71717a',
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                            }}
                                        >
                                            {dateStr}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            color: '#1f2d22',
                                            fontSize: 13.5,
                                        }}
                                    >
                                        {dx0
                                            ? `${dx0.code} – ${dx0.label}`
                                            : (e.motivo_consulta ??
                                              'Sin diagnóstico')}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: '#71717a',
                                        }}
                                    >
                                        {e.doctor.full_name} ·{' '}
                                        {e.doctor.specialty ?? ''}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        fontSize: 15,
                                        color: '#a1a1aa',
                                        flexShrink: 0,
                                        marginTop: 2,
                                    }}
                                >
                                    ›
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Right detail */}
                <div
                    style={{
                        flex: '2 1 480px',
                        minWidth: 0,
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        fontSize: 13.5,
                    }}
                >
                    {sel ? (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <span
                                    style={{
                                        padding: '2px 10px',
                                        borderRadius: 999,
                                        background: '#DBEAFE',
                                        color: '#1E40AF',
                                        fontWeight: 600,
                                        fontSize: 12,
                                    }}
                                >
                                    Consulta
                                </span>
                                <span
                                    style={{ color: '#71717a', fontSize: 12.5 }}
                                >
                                    {format(
                                        new Date(sel.consulted_at),
                                        'dd/MM/yyyy HH:mm',
                                        { locale: es },
                                    )}
                                </span>
                            </div>
                            <div
                                style={{
                                    fontFamily: 'Bitter,Georgia,serif',
                                    fontWeight: 600,
                                    fontSize: 19,
                                    color: '#1f2d22',
                                }}
                            >
                                {sel.diagnosticos?.[0]
                                    ? `${sel.diagnosticos[0].code} – ${sel.diagnosticos[0].label}`
                                    : (sel.motivo_consulta ??
                                      'Sin diagnóstico')}
                            </div>
                            <div style={{ color: '#52525b' }}>
                                {sel.doctor.full_name} · {sel.doctor.specialty}
                            </div>

                            {sel.diagnosticos &&
                                sel.diagnosticos.length > 0 && (
                                    <div
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            background: '#F6FAF1',
                                            border: '1px solid #DCEBC9',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 11,
                                                fontWeight: 600,
                                                color: '#56693f',
                                                textTransform: 'uppercase',
                                                letterSpacing: '.05em',
                                            }}
                                        >
                                            Diagnóstico(s)
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 4,
                                                marginTop: 4,
                                            }}
                                        >
                                            {sel.diagnosticos.map((dx, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        fontWeight: 600,
                                                        color: '#1f2d22',
                                                    }}
                                                >
                                                    {dx.code} – {dx.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            {sel.motivo_consulta && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: '#71717a',
                                            textTransform: 'uppercase',
                                            letterSpacing: '.05em',
                                            marginBottom: 4,
                                        }}
                                    >
                                        Motivo
                                    </div>
                                    <p style={{ margin: 0, color: '#1f2d22' }}>
                                        {sel.motivo_consulta}
                                    </p>
                                </div>
                            )}

                            {sel.plan_tratamiento && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: '#71717a',
                                            textTransform: 'uppercase',
                                            letterSpacing: '.05em',
                                            marginBottom: 4,
                                        }}
                                    >
                                        Plan
                                    </div>
                                    <p style={{ margin: 0, color: '#1f2d22' }}>
                                        {sel.plan_tratamiento}
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div
                            style={{
                                color: '#71717a',
                                textAlign: 'center',
                                padding: '40px 0',
                            }}
                        >
                            Selecciona un registro para ver el detalle.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
