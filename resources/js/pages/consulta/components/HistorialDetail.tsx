import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    formatPesoLb,
    formatTallaFtIn,
    computeImcFromMetric,
} from '@/lib/units';
import { buildInstruction } from '../lib/instructionBuilder';
import { DischargeBadge } from './HistorialList';
import { HistorialEntry } from '../types';

// ─── Prescription Detail ──────────────────────────────────────────────────────

function PrescriptionDetail({
    prescription,
    prescriptionId,
}: {
    prescription: NonNullable<HistorialEntry['prescription']>;
    prescriptionId: number;
}) {
    return (
        <div className="rounded-[10px] border border-divider bg-surface px-[14px] py-[10px]">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                    Receta
                </div>
                <a
                    href={`/consulta/recetas/${prescriptionId}/imprimir`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-list-row-bg px-[10px] py-[2px] text-[12px] font-semibold text-primary"
                >
                    Imprimir
                </a>
            </div>
            {prescription.items.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {prescription.items.map((item) => (
                        <div key={item.id} className="text-[13px]">
                            <div className="font-semibold text-text-heading">
                                {item.medication}
                            </div>
                            <div className="text-muted">
                                {buildInstruction({
                                    dose: item.dose,
                                    route: item.route,
                                    frequency: item.frequency,
                                    duration_days: item.duration_days,
                                    is_continuous: item.is_continuous,
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="m-0 text-[13px] text-muted">
                    Sin medicamentos registrados.
                </p>
            )}
            {prescription.general_instructions && (
                <div className="mt-2 text-[13px] text-muted">
                    <span className="font-semibold">Indicaciones: </span>
                    {prescription.general_instructions}
                </div>
            )}
        </div>
    );
}

// ─── HistorialDetail ─────────────────────────────────────────────────────────

type Props = {
    sel: HistorialEntry | null;
    onViewReceta: () => void;
    showingReceta: boolean;
};

export default function HistorialDetail({
    sel,
    onViewReceta,
    showingReceta,
}: Props) {
    if (!sel) {
        return (
            <div className="flex min-w-0 flex-[2_1_480px] items-center justify-center py-10 text-muted">
                Selecciona un registro para ver el detalle.
            </div>
        );
    }

    return (
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-4 p-5 px-6 text-[13.5px]">
            <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-badge-consulta-bg px-[10px] py-[2px] text-[12px] font-semibold text-consulta-num">
                    Consulta
                </span>
                {sel.discharge && <DischargeBadge discharge={sel.discharge} />}
                <span className="text-[12.5px] text-muted">
                    {format(new Date(sel.consulted_at), 'dd/MM/yyyy HH:mm', {
                        locale: es,
                    })}
                </span>
                {sel.prescription_id && !showingReceta && (
                    <button
                        onClick={onViewReceta}
                        className="cursor-pointer rounded-full border-0 bg-list-row-bg px-[10px] py-[2px] text-[12px] font-semibold text-primary"
                    >
                        Ver receta
                    </button>
                )}
            </div>

            <div className="font-serif text-[19px] font-semibold text-text-heading">
                {sel.diagnosticos?.[0]
                    ? `${sel.diagnosticos[0].code} – ${sel.diagnosticos[0].label}`
                    : (sel.motivo_consulta ?? 'Sin diagnóstico')}
            </div>
            <div className="text-text-dim">
                {sel.doctor.full_name} · {sel.doctor.specialty}
            </div>

            {showingReceta && sel.prescription && sel.prescription_id && (
                <PrescriptionDetail
                    prescription={sel.prescription}
                    prescriptionId={sel.prescription_id}
                />
            )}

            {sel.diagnosticos && sel.diagnosticos.length > 0 && (
                <div className="rounded-[10px] border border-success-border bg-table-header-bg px-[14px] py-[10px]">
                    <div className="text-[11px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                        Diagnóstico(s)
                    </div>
                    <div className="mt-1 flex flex-col gap-1">
                        {sel.diagnosticos.map((dx, i) => (
                            <div
                                key={i}
                                className="font-semibold text-text-heading"
                            >
                                {dx.code} – {dx.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {sel.motivo_consulta && (
                <div>
                    <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                        Motivo
                    </div>
                    <p className="m-0 text-text-heading">{sel.motivo_consulta}</p>
                </div>
            )}

            {sel.plan_tratamiento && (
                <div>
                    <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                        Plan
                    </div>
                    <p className="m-0 text-text-heading">
                        {sel.plan_tratamiento}
                    </p>
                </div>
            )}

            {sel.discharge?.discharge_diagnosis && (
                <div>
                    <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                        Diagnóstico de egreso
                    </div>
                    <p className="m-0 text-text-heading">
                        {sel.discharge.discharge_diagnosis}
                    </p>
                    {sel.discharge.destination && (
                        <p className="m-0 mt-1 text-[13px] text-muted">
                            Traslado a: {sel.discharge.destination}
                        </p>
                    )}
                </div>
            )}

            {(sel.vitals.peso !== null ||
                sel.vitals.talla !== null ||
                sel.vitals.presion_arterial !== null ||
                sel.vitals.frecuencia_cardiaca !== null ||
                sel.vitals.temp !== null) && (
                <div>
                    <div className="mb-2 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                        Signos vitales
                    </div>
                    <div className="flex flex-wrap gap-3 text-[13px]">
                        {sel.vitals.peso !== null && (
                            <span className="text-text-heading">
                                <span className="text-muted">Peso </span>
                                {formatPesoLb(sel.vitals.peso)}
                            </span>
                        )}
                        {sel.vitals.talla !== null && (
                            <span className="text-text-heading">
                                <span className="text-muted">Talla </span>
                                {formatTallaFtIn(sel.vitals.talla)}
                            </span>
                        )}
                        {sel.vitals.peso !== null &&
                            sel.vitals.talla !== null && (
                                <span className="text-text-heading">
                                    <span className="text-muted">IMC </span>
                                    {
                                        computeImcFromMetric(
                                            sel.vitals.peso,
                                            sel.vitals.talla,
                                        ).display
                                    }
                                </span>
                            )}
                        {sel.vitals.presion_arterial !== null && (
                            <span className="text-text-heading">
                                <span className="text-muted">PA </span>
                                {sel.vitals.presion_arterial} mmHg
                            </span>
                        )}
                        {sel.vitals.frecuencia_cardiaca !== null && (
                            <span className="text-text-heading">
                                <span className="text-muted">FC </span>
                                {sel.vitals.frecuencia_cardiaca} lpm
                            </span>
                        )}
                        {sel.vitals.temp !== null && (
                            <span className="text-text-heading">
                                <span className="text-muted">T° </span>
                                {(sel.vitals.temp / 10).toFixed(1)} °C
                            </span>
                        )}
                        {sel.vitals.saturacion_o2 !== null && (
                            <span className="text-text-heading">
                                <span className="text-muted">SpO₂ </span>
                                {sel.vitals.saturacion_o2}%
                            </span>
                        )}
                        {sel.vitals.glucemia !== null && (
                            <span className="text-text-heading">
                                <span className="text-muted">Glucemia </span>
                                {sel.vitals.glucemia} mg/dL
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
