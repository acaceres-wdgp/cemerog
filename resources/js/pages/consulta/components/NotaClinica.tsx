import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { lbToKgTimes10, feetInchesToCm } from '@/lib/units';
import { AntecedentData, NoteFormData, TurnItem } from '../types';
import AntecedentesPanel from './AntecedentesPanel';
import SignosVitales from './SignosVitales';
import DiagnosticoCie10 from './DiagnosticoCie10';

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
    const pageErrors = usePage().props.errors as
        | Partial<{ peso: string; talla: string }>
        | undefined;

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
                    <SignosVitales
                        form={form}
                        onChange={(patch) =>
                            setForm((f) => ({ ...f, ...patch }))
                        }
                        errors={pageErrors}
                    />

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
                    <DiagnosticoCie10
                        diagnosticos={form.diagnosticos}
                        dxInput={dxInput}
                        onDxInputChange={setDxInput}
                        onAddDx={handleAddDx}
                        onRemoveDx={(i) =>
                            setForm((f) => ({
                                ...f,
                                diagnosticos: f.diagnosticos.filter(
                                    (_, j) => j !== i,
                                ),
                            }))
                        }
                    />

                    <label className="flex flex-col gap-[6px]">
                        <span className="font-medium">Plan</span>
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
