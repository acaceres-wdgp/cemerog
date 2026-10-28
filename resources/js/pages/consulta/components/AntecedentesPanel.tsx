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

    const inputCls =
        'h-[34px] px-[10px] border border-input-border rounded-[10px] outline-none font-sans text-[13px] w-full';

    function handleSaveAnte() {
        router.patch(`/consulta/antecedentes/${patientId}`, anteForm, {
            onSuccess: () => setShowAnte(false),
        });
    }

    return (
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <div className="rounded-[14px] border border-card-border bg-white">
                <div className="flex items-center justify-between gap-2 border-b border-divider px-[18px] py-[14px]">
                    <span className="font-semibold">Antecedentes</span>
                    <button
                        onClick={() =>
                            showAnte ? handleSaveAnte() : setShowAnte(true)
                        }
                        className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-primary"
                    >
                        {showAnte ? 'Guardar' : 'Editar'}
                    </button>
                </div>

                {!showAnte && (
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-[18px] py-[14px] text-[13px]">
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
                                <span className="text-muted">{row.label}</span>
                                <span>
                                    {row.val || (
                                        <span className="text-muted-light">
                                            —
                                        </span>
                                    )}
                                </span>
                            </React.Fragment>
                        ))}
                        <span className="text-muted">Alergias</span>
                        <span
                            // dynamic-style: alergias text color/weight depends on whether value is present
                            style={{
                                color:
                                    (antecedents?.alergias ??
                                    turn.patient.allergies)
                                        ? 'var(--color-error)'
                                        : 'var(--color-muted-light)',
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
                    <div className="flex flex-col gap-[14px] px-[18px] py-[14px] text-[13px]">
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
                                className="flex flex-col gap-[6px]"
                            >
                                <span className="font-medium">{f.label}</span>
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
                                    className={inputCls}
                                />
                            </label>
                        ))}
                        <label className="flex flex-col gap-[6px]">
                            <span className="inline-flex items-center gap-[6px] font-medium text-error">
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
                                className="h-[34px] w-full rounded-[10px] border border-error-border px-[10px] font-sans text-[13px] outline-none"
                            />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
