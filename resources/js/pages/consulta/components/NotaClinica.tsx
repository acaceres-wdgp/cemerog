import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { computeImc } from '../lib/helpers';
import { AntecedentData, Diagnostico, NoteFormData, TurnItem } from '../types';
import AntecedentesPanel from './AntecedentesPanel';

// ─── Clinical Note Form ───────────────────────────────────────────────────────

export default function NotaClinica({
    turn,
    antecedents,
    patientId,
}: {
    turn: TurnItem;
    antecedents: AntecedentData;
    patientId: number;
}) {
    const [form, setForm] = useState<NoteFormData>({
        motivo_consulta: '',
        historia_enfermedad: '',
        examen_fisico: '',
        plan_tratamiento: '',
        presion_arterial: '',
        frecuencia_cardiaca: '',
        frecuencia_respiratoria: '',
        temp: '',
        saturacion_o2: '',
        glucemia: '',
        peso: '',
        talla: '',
        diagnosticos: [],
    });
    const [dxInput, setDxInput] = useState('');

    const imc = computeImc(
        form.peso ? Number(form.peso) * 10 : null,
        form.talla ? Number(form.talla) : null,
    );

    const VITALS = [
        {
            key: 'presion_arterial',
            label: 'Presión arterial',
            unit: 'mmHg',
            isString: true,
        },
        {
            key: 'frecuencia_cardiaca',
            label: 'Frec. cardíaca',
            unit: 'lpm',
            isString: false,
        },
        {
            key: 'frecuencia_respiratoria',
            label: 'Frec. respiratoria',
            unit: 'rpm',
            isString: false,
        },
        { key: 'temp', label: 'Temperatura', unit: '°C', isString: false },
        { key: 'saturacion_o2', label: 'SpO₂', unit: '%', isString: false },
        { key: 'glucemia', label: 'Glucemia', unit: 'mg/dL', isString: false },
        { key: 'peso', label: 'Peso', unit: 'kg', isString: false },
        { key: 'talla', label: 'Talla', unit: 'cm', isString: false },
    ] as const;

    function handleAddDx() {
        const raw = dxInput.trim();
        if (!raw) return;
        const match = raw.match(/^([A-Z]\d{2}(?:\.\d+)?)\s+(.+)$/);
        if (match) {
            setForm((f) => ({
                ...f,
                diagnosticos: [
                    ...f.diagnosticos,
                    { code: match[1], label: match[2] },
                ],
            }));
        } else {
            setForm((f) => ({
                ...f,
                diagnosticos: [...f.diagnosticos, { code: '—', label: raw }],
            }));
        }
        setDxInput('');
    }

    function handleSaveNote() {
        router.post(
            '/consulta',
            {
                patient_id: turn.patient.id,
                doctor_id: turn.doctor.id,
                turn_id: turn.id,
                motivo_consulta: form.motivo_consulta || null,
                historia_enfermedad: form.historia_enfermedad || null,
                examen_fisico: form.examen_fisico || null,
                plan_tratamiento: form.plan_tratamiento || null,
                presion_arterial: form.presion_arterial || null,
                frecuencia_cardiaca: form.frecuencia_cardiaca
                    ? Number(form.frecuencia_cardiaca)
                    : null,
                frecuencia_respiratoria: form.frecuencia_respiratoria
                    ? Number(form.frecuencia_respiratoria)
                    : null,
                temp: form.temp ? Math.round(Number(form.temp) * 10) : null,
                saturacion_o2: form.saturacion_o2
                    ? Number(form.saturacion_o2)
                    : null,
                glucemia: form.glucemia ? Number(form.glucemia) : null,
                peso: form.peso ? Math.round(Number(form.peso) * 10) : null,
                talla: form.talla ? Number(form.talla) : null,
                diagnosticos: form.diagnosticos.length
                    ? form.diagnosticos
                    : null,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['historial', 'historial_patient'],
            },
        );
    }

    const textareaStyle: React.CSSProperties = {
        padding: '8px 12px',
        border: '1px solid #e4e4e7',
        borderRadius: 10,
        outline: 'none',
        fontFamily: 'inherit',
        fontSize: 14,
        resize: 'vertical',
        width: '100%',
        boxSizing: 'border-box',
    };

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                alignItems: 'flex-start',
            }}
        >
            {/* Clinical note */}
            <div
                style={{
                    background: '#fff',
                    border: '1px solid #e3e9e3',
                    borderRadius: 14,
                    flex: '2 1 520px',
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #eef0ec',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
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
                        Nota clínica
                    </div>
                </div>
                <div
                    style={{
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                    }}
                >
                    {/* Vitals */}
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 8,
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#2f4a17',
                            }}
                        >
                            <span
                                style={{
                                    width: 3,
                                    height: 14,
                                    background: '#8CC63F',
                                    borderRadius: 2,
                                    display: 'inline-block',
                                }}
                            />
                            Signos vitales
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fill,minmax(118px,1fr))',
                                gap: 8,
                            }}
                        >
                            {VITALS.map((v) => (
                                <label
                                    key={v.key}
                                    style={{
                                        border: '1px solid #e4e4e7',
                                        background: '#fff',
                                        borderRadius: 10,
                                        padding: '6px 10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        cursor: 'text',
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 12,
                                            color: '#71717a',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {v.label}
                                    </span>
                                    <span
                                        style={{
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: 4,
                                        }}
                                    >
                                        <input
                                            value={form[v.key]}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    [v.key]: e.target.value,
                                                }))
                                            }
                                            style={{
                                                flex: 1,
                                                minWidth: 0,
                                                width: '100%',
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                padding: 0,
                                                fontFamily: 'inherit',
                                                fontWeight: 600,
                                                fontVariantNumeric:
                                                    'tabular-nums',
                                                color: '#1f2d22',
                                                fontSize: 14,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: 11.5,
                                                color: '#a1a1aa',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {v.unit}
                                        </span>
                                    </span>
                                </label>
                            ))}
                            {/* IMC (auto-computed) */}
                            <div
                                style={{
                                    border: '1px dashed #e4e4e7',
                                    borderRadius: 10,
                                    padding: '6px 10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    background: '#fafafa',
                                }}
                            >
                                <span
                                    style={{ fontSize: 12, color: '#71717a' }}
                                >
                                    IMC
                                </span>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        fontVariantNumeric: 'tabular-nums',
                                        color: '#1f2d22',
                                        fontSize: 14,
                                    }}
                                >
                                    {imc}
                                </span>
                            </div>
                        </div>
                    </div>

                    <label
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        <span style={{ fontWeight: 500 }}>
                            Motivo de consulta
                        </span>
                        <textarea
                            rows={2}
                            style={textareaStyle}
                            value={form.motivo_consulta}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    motivo_consulta: e.target.value,
                                }))
                            }
                        />
                    </label>

                    <label
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        <span style={{ fontWeight: 500 }}>
                            Historia de la enfermedad actual
                        </span>
                        <textarea
                            rows={3}
                            style={textareaStyle}
                            value={form.historia_enfermedad}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    historia_enfermedad: e.target.value,
                                }))
                            }
                        />
                    </label>

                    <label
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        <span style={{ fontWeight: 500 }}>Examen físico</span>
                        <textarea
                            rows={2}
                            style={textareaStyle}
                            value={form.examen_fisico}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    examen_fisico: e.target.value,
                                }))
                            }
                        />
                    </label>

                    {/* Diagnóstico CIE-10 */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        <span style={{ fontWeight: 500 }}>
                            Diagnóstico (CIE-10)
                        </span>
                        <div
                            style={{
                                minHeight: 42,
                                padding: '5px 8px',
                                border: '1px solid #e4e4e7',
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                            }}
                        >
                            {form.diagnosticos.map(
                                (dx: Diagnostico, i: number) => (
                                    <span
                                        key={i}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '3px 10px',
                                            borderRadius: 999,
                                            background: '#f4f4f5',
                                            fontSize: 13,
                                        }}
                                    >
                                        <strong style={{ fontWeight: 600 }}>
                                            {dx.code}
                                        </strong>{' '}
                                        {dx.label}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setForm((f) => ({
                                                    ...f,
                                                    diagnosticos:
                                                        f.diagnosticos.filter(
                                                            (_, j) => j !== i,
                                                        ),
                                                }))
                                            }
                                            style={{
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#71717a',
                                                cursor: 'pointer',
                                                padding: 0,
                                                fontSize: 13,
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ),
                            )}
                            <input
                                value={dxInput}
                                onChange={(e) => setDxInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddDx();
                                    }
                                }}
                                placeholder="Ej: N39.0 Infección de vías urinarias"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontFamily: 'inherit',
                                    fontSize: 13,
                                    flex: 1,
                                    minWidth: 180,
                                    color:
                                        form.diagnosticos.length === 0
                                            ? '#a1a1aa'
                                            : '#1f2d22',
                                }}
                            />
                        </div>
                    </div>

                    <label
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                        }}
                    >
                        <span style={{ fontWeight: 500 }}>
                            Plan e indicaciones
                        </span>
                        <textarea
                            rows={2}
                            style={textareaStyle}
                            value={form.plan_tratamiento}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    plan_tratamiento: e.target.value,
                                }))
                            }
                        />
                    </label>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: 12,
                            paddingTop: 12,
                            borderTop: '1px solid #eef0ec',
                            flexWrap: 'wrap',
                        }}
                    >
                        <button
                            onClick={handleSaveNote}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                height: 36,
                                padding: '0 16px',
                                borderRadius: 10,
                                border: 'none',
                                background: '#2E8B3E',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        >
                            ✓ Guardar nota
                        </button>
                    </div>
                </div>
            </div>

            {/* Antecedentes */}
            <AntecedentesPanel
                antecedents={antecedents}
                patientId={patientId}
                turn={turn}
            />
        </div>
    );
}
