import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { AntecedentData, TurnItem } from '../types';

// ─── Antecedentes Panel ────────────────────────────────────────────────────────

export default function AntecedentesPanel({
    antecedents,
    patientId,
    turn,
}: {
    antecedents: AntecedentData;
    patientId: number;
    turn: TurnItem;
}) {
    const [showAnte, setShowAnte] = useState(false);
    const [anteForm, setAnteForm] = useState({
        personales: antecedents?.personales ?? '',
        quirurgicos: antecedents?.quirurgicos ?? '',
        medicamentos: antecedents?.medicamentos ?? '',
        familiares: antecedents?.familiares ?? '',
        alergias: antecedents?.alergias ?? turn.patient.allergies ?? '',
    });

    const inputStyle: React.CSSProperties = {
        height: 34,
        padding: '0 10px',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        outline: 'none',
        fontFamily: 'inherit',
        fontSize: 13,
        width: '100%',
        boxSizing: 'border-box',
    };

    function handleSaveAnte() {
        router.patch(`/consulta/antecedentes/${patientId}`, anteForm, {
            onSuccess: () => setShowAnte(false),
        });
    }

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                flex: '1 1 320px',
                minWidth: 0,
            }}
        >
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                }}
            >
                <div
                    style={{
                        padding: '14px 18px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <span style={{ fontWeight: 600 }}>Antecedentes</span>
                    <button
                        onClick={() =>
                            showAnte ? handleSaveAnte() : setShowAnte(true)
                        }
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#2E8B3E',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                    >
                        {showAnte ? 'Guardar' : 'Editar'}
                    </button>
                </div>

                {!showAnte && (
                    <div
                        style={{
                            padding: '14px 18px',
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr',
                            gap: '8px 12px',
                            fontSize: 13,
                        }}
                    >
                        {[
                            {
                                label: 'Personales',
                                val: antecedents?.personales,
                            },
                            {
                                label: 'Quirúrgicos',
                                val: antecedents?.quirurgicos,
                            },
                            {
                                label: 'Medicamentos',
                                val: antecedents?.medicamentos,
                            },
                            {
                                label: 'Familiares',
                                val: antecedents?.familiares,
                            },
                        ].map((row) => (
                            <React.Fragment key={row.label}>
                                <span style={{ color: '#71717a' }}>
                                    {row.label}
                                </span>
                                <span>
                                    {row.val || (
                                        <span style={{ color: '#a1a1aa' }}>
                                            —
                                        </span>
                                    )}
                                </span>
                            </React.Fragment>
                        ))}
                        <span style={{ color: '#71717a' }}>Alergias</span>
                        <span
                            style={{
                                color:
                                    (antecedents?.alergias ??
                                    turn.patient.allergies)
                                        ? '#b91c1c'
                                        : '#a1a1aa',
                                fontWeight:
                                    (antecedents?.alergias ??
                                    turn.patient.allergies)
                                        ? 600
                                        : 400,
                            }}
                        >
                            {antecedents?.alergias ??
                                turn.patient.allergies ??
                                '—'}
                        </span>
                    </div>
                )}

                {showAnte && (
                    <div
                        style={{
                            padding: '14px 18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                            fontSize: 13,
                        }}
                    >
                        {[
                            { key: 'personales', label: 'Personales' },
                            { key: 'quirurgicos', label: 'Quirúrgicos' },
                            {
                                key: 'medicamentos',
                                label: 'Medicamentos actuales',
                            },
                            { key: 'familiares', label: 'Familiares' },
                        ].map((f) => (
                            <label
                                key={f.key}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>
                                    {f.label}
                                </span>
                                <input
                                    value={
                                        anteForm[
                                            f.key as keyof typeof anteForm
                                        ] ?? ''
                                    }
                                    onChange={(e) =>
                                        setAnteForm((a) => ({
                                            ...a,
                                            [f.key]: e.target.value,
                                        }))
                                    }
                                    style={inputStyle}
                                />
                            </label>
                        ))}
                        <label
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontWeight: 500,
                                    color: '#b91c1c',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                ⚠ Alergias
                            </span>
                            <input
                                value={anteForm.alergias ?? ''}
                                onChange={(e) =>
                                    setAnteForm((a) => ({
                                        ...a,
                                        alergias: e.target.value,
                                    }))
                                }
                                style={{
                                    ...inputStyle,
                                    border: '1px solid #fecaca',
                                }}
                            />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
