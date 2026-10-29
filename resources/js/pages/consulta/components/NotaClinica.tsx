import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import {
    lbToKgTimes10,
    feetInchesToCm,
    computeImcFromMetric,
} from '@/lib/units';
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
        pesoLb: '',
        tallaPies: '',
        tallaPulgadas: '',
        diagnosticos: [],
    });
    const [dxInput, setDxInput] = useState('');

    const pesoKgTimes10 = form.pesoLb
        ? lbToKgTimes10(Number(form.pesoLb))
        : null;
    const tallaCm =
        form.tallaPies || form.tallaPulgadas
            ? feetInchesToCm(
                  Number(form.tallaPies) || 0,
                  Number(form.tallaPulgadas) || 0,
              )
            : null;
    const imc = computeImcFromMetric(pesoKgTimes10, tallaCm);

    const SIMPLE_VITALS = [
        {
            key: 'presion_arterial' as const,
            label: 'Presión arterial',
            unit: 'mmHg',
        },
        {
            key: 'frecuencia_cardiaca' as const,
            label: 'Frec. cardíaca',
            unit: 'lpm',
        },
        {
            key: 'frecuencia_respiratoria' as const,
            label: 'Frec. respiratoria',
            unit: 'rpm',
        },
        { key: 'temp' as const, label: 'Temperatura', unit: '°C' },
        { key: 'saturacion_o2' as const, label: 'SpO₂', unit: '%' },
        { key: 'glucemia' as const, label: 'Glucemia', unit: 'mg/dL' },
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
                // Convert lb → kg×10 for storage
                peso: form.pesoLb ? lbToKgTimes10(Number(form.pesoLb)) : null,
                // Convert ft+in → cm for storage
                talla:
                    form.tallaPies || form.tallaPulgadas
                        ? feetInchesToCm(
                              Number(form.tallaPies) || 0,
                              Number(form.tallaPulgadas) || 0,
                          )
                        : null,
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

    const textareaCls =
        'p-2 px-3 border border-input-border rounded-[10px] outline-none font-sans text-sm resize-y w-full';

    return (
        <div className="flex flex-wrap items-start gap-4">
            {/* Clinical note */}
            <div className="min-w-0 flex-[2_1_520px] rounded-[14px] border border-card-border bg-white">
                <div className="flex items-center justify-between border-b border-divider px-5 py-4">
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Nota clínica
                    </div>
                </div>
                <div className="flex flex-col gap-4 px-5 py-4">
                    {/* Vitals */}
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-accent-fg">
                            <span className="inline-block h-[14px] w-[3px] rounded-sm bg-accent" />
                            Signos vitales
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-2">
                            {SIMPLE_VITALS.map((v) => (
                                <label
                                    key={v.key}
                                    className="flex cursor-text flex-col gap-[2px] rounded-[10px] border border-input-border bg-white px-[10px] py-[6px]"
                                >
                                    <span className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-muted">
                                        {v.label}
                                    </span>
                                    <span className="flex items-baseline gap-1">
                                        <input
                                            value={form[v.key]}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    [v.key]: e.target.value,
                                                }))
                                            }
                                            className="w-full min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-sm font-semibold text-text-heading tabular-nums outline-none"
                                        />
                                        <span className="text-[11.5px] whitespace-nowrap text-muted-light">
                                            {v.unit}
                                        </span>
                                    </span>
                                </label>
                            ))}

                            {/* Weight in lb */}
                            <label className="flex cursor-text flex-col gap-[2px] rounded-[10px] border border-input-border bg-white px-[10px] py-[6px]">
                                <span className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-muted">
                                    Peso (lb)
                                </span>
                                <span className="flex items-baseline gap-1">
                                    <input
                                        type="number"
                                        min={2}
                                        max={700}
                                        value={form.pesoLb}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                pesoLb: e.target.value,
                                            }))
                                        }
                                        className="w-full min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-sm font-semibold text-text-heading tabular-nums outline-none"
                                    />
                                    <span className="text-[11.5px] whitespace-nowrap text-muted-light">
                                        lb
                                    </span>
                                </span>
                                {form.pesoLb &&
                                    (Number(form.pesoLb) < 2 ||
                                        Number(form.pesoLb) > 700) && (
                                        <span className="text-[11px] text-error">
                                            Rango: 2–700 lb
                                        </span>
                                    )}
                            </label>

                            {/* Height: feet */}
                            <label className="flex cursor-text flex-col gap-[2px] rounded-[10px] border border-input-border bg-white px-[10px] py-[6px]">
                                <span className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-muted">
                                    Pies
                                </span>
                                <span className="flex items-baseline gap-1">
                                    <input
                                        type="number"
                                        min={1}
                                        max={7}
                                        value={form.tallaPies}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                tallaPies: e.target.value,
                                            }))
                                        }
                                        className="w-full min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-sm font-semibold text-text-heading tabular-nums outline-none"
                                    />
                                    <span className="text-[11.5px] whitespace-nowrap text-muted-light">
                                        ft
                                    </span>
                                </span>
                            </label>

                            {/* Height: inches */}
                            <label className="flex cursor-text flex-col gap-[2px] rounded-[10px] border border-input-border bg-white px-[10px] py-[6px]">
                                <span className="overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-muted">
                                    Pulgadas
                                </span>
                                <span className="flex items-baseline gap-1">
                                    <input
                                        type="number"
                                        min={0}
                                        max={11}
                                        value={form.tallaPulgadas}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                tallaPulgadas: e.target.value,
                                            }))
                                        }
                                        className="w-full min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-sm font-semibold text-text-heading tabular-nums outline-none"
                                    />
                                    <span className="text-[11.5px] whitespace-nowrap text-muted-light">
                                        in
                                    </span>
                                </span>
                                {form.tallaPulgadas &&
                                    (Number(form.tallaPulgadas) < 0 ||
                                        Number(form.tallaPulgadas) > 11) && (
                                        <span className="text-[11px] text-error">
                                            0–11 in
                                        </span>
                                    )}
                            </label>

                            {/* IMC (auto-computed) */}
                            <div className="flex flex-col gap-[2px] rounded-[10px] border border-dashed border-input-border bg-done-row-bg px-[10px] py-[6px]">
                                <span className="text-[12px] text-muted">
                                    IMC
                                </span>
                                <span className="text-sm font-semibold text-text-heading tabular-nums">
                                    {imc.display}
                                </span>
                            </div>
                        </div>
                    </div>

                    <label className="flex flex-col gap-[6px]">
                        <span className="font-medium">Motivo de consulta</span>
                        <textarea
                            rows={2}
                            className={textareaCls}
                            value={form.motivo_consulta}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    motivo_consulta: e.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="flex flex-col gap-[6px]">
                        <span className="font-medium">
                            Historia de la enfermedad actual
                        </span>
                        <textarea
                            rows={3}
                            className={textareaCls}
                            value={form.historia_enfermedad}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    historia_enfermedad: e.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="flex flex-col gap-[6px]">
                        <span className="font-medium">Examen físico</span>
                        <textarea
                            rows={2}
                            className={textareaCls}
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
                    <div className="flex flex-col gap-[6px]">
                        <span className="font-medium">
                            Diagnóstico (CIE-10)
                        </span>
                        <div className="flex min-h-[42px] flex-wrap items-center gap-[6px] rounded-[10px] border border-input-border px-2 py-[5px]">
                            {form.diagnosticos.map(
                                (dx: Diagnostico, i: number) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-[6px] rounded-full bg-muted-bg px-[10px] py-[3px] text-[13px]"
                                    >
                                        <strong className="font-semibold">
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
                                            className="cursor-pointer border-0 bg-transparent p-0 text-[13px] text-muted"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ),
                            )}
                            {/* dynamic-style: placeholder color depends on diagnosticos length */}
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
                                className={cn(
                                    'min-w-[180px] flex-1 border-0 bg-transparent font-sans text-[13px] outline-none',
                                    form.diagnosticos.length === 0
                                        ? 'text-muted-light'
                                        : 'text-text-heading',
                                )}
                            />
                        </div>
                    </div>

                    <label className="flex flex-col gap-[6px]">
                        <span className="font-medium">Plan e indicaciones</span>
                        <textarea
                            rows={2}
                            className={textareaCls}
                            value={form.plan_tratamiento}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    plan_tratamiento: e.target.value,
                                }))
                            }
                        />
                    </label>

                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-divider pt-3">
                        <button
                            onClick={handleSaveNote}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border-0 bg-primary px-4 font-sans text-sm font-medium text-white"
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
