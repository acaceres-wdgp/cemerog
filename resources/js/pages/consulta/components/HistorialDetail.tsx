import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    formatPesoLb,
    formatTallaFtIn,
    computeImcFromMetric,
} from '@/lib/units';
import consulta from '@/routes/consulta';
import { buildInstruction } from '../lib/instructionBuilder';
import { ClinicalEntry, DischargeDetail, PrescriptionData } from '../types';
import ImagingReportBlock from '@/components/img/ImagingReportBlock';
import LabResultsList from '@/components/lab/LabResultsList';

// ─── Prescription block ───────────────────────────────────────────────────────

export function PrescriptionBlock({
    prescription,
    canPrint = true,
}: {
    prescription: PrescriptionData;
    /** The print route needs an active doctor; hide the link otherwise */
    canPrint?: boolean;
}) {
    return (
        <div className="rounded-[10px] border border-divider bg-surface px-[14px] py-[10px]">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                    Receta
                </div>
                {canPrint && (
                    <a
                        href={consulta.receta.print.url(prescription.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-list-row-bg px-[10px] py-[2px] text-[12px] font-semibold text-primary"
                    >
                        Imprimir
                    </a>
                )}
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

// ─── Discharge block ──────────────────────────────────────────────────────────

function DischargeBlock({ discharge }: { discharge: DischargeDetail }) {
    return (
        <div>
            <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                Diagnóstico de egreso
            </div>
            <p className="m-0 text-text-heading">
                {discharge.discharge_diagnosis}
            </p>
            {discharge.destination && (
                <p className="m-0 mt-1 text-[13px] text-muted">
                    Traslado a: {discharge.destination}
                </p>
            )}
        </div>
    );
}

// ─── Vitals block ─────────────────────────────────────────────────────────────

function VitalsBlock({
    vitals,
}: {
    vitals: NonNullable<ClinicalEntry['vitals']>;
}) {
    if (
        vitals.peso === null &&
        vitals.talla === null &&
        vitals.presion_arterial === null &&
        vitals.frecuencia_cardiaca === null &&
        vitals.temp === null
    )
        return null;
    return (
        <div>
            <div className="mb-2 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                Signos vitales
            </div>
            <div className="flex flex-wrap gap-3 text-[13px]">
                {vitals.peso !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">Peso </span>
                        {formatPesoLb(vitals.peso)}
                    </span>
                )}
                {vitals.talla !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">Talla </span>
                        {formatTallaFtIn(vitals.talla)}
                    </span>
                )}
                {vitals.peso !== null && vitals.talla !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">IMC </span>
                        {
                            computeImcFromMetric(vitals.peso, vitals.talla)
                                .display
                        }
                    </span>
                )}
                {vitals.presion_arterial !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">PA </span>
                        {vitals.presion_arterial} mmHg
                    </span>
                )}
                {vitals.frecuencia_cardiaca !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">FC </span>
                        {vitals.frecuencia_cardiaca} lpm
                    </span>
                )}
                {vitals.temp !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">T° </span>
                        {(vitals.temp / 10).toFixed(1)} °C
                    </span>
                )}
                {vitals.saturacion_o2 !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">SpO₂ </span>
                        {vitals.saturacion_o2}%
                    </span>
                )}
                {vitals.glucemia !== null && (
                    <span className="text-text-heading">
                        <span className="text-muted">Glucemia </span>
                        {vitals.glucemia} mg/dL
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── HistorialDetail ─────────────────────────────────────────────────────────

export default function HistorialDetail({
    sel,
    canPrint = true,
}: {
    sel: ClinicalEntry | null;
    canPrint?: boolean;
}) {
    if (!sel) {
        return (
            <div className="flex min-w-0 flex-[2_1_480px] items-center justify-center py-10 text-muted">
                Selecciona un registro para ver el detalle.
            </div>
        );
    }

    const dateStr = format(new Date(sel.date), 'dd/MM/yyyy HH:mm', {
        locale: es,
    });

    return (
        <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-4 p-5 px-6 text-[13.5px]">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-[12.5px] text-muted">{dateStr}</span>
                <span className="text-[12px] text-text-dim">
                    {sel.doctor.full_name} · {sel.doctor.specialty}
                </span>
            </div>

            {/* Receta entry */}
            {sel.type === 'receta' && sel.prescription && (
                <PrescriptionBlock
                    prescription={sel.prescription}
                    canPrint={canPrint}
                />
            )}

            {/* Laboratorio entry */}
            {sel.type === 'laboratorio' && sel.lab && (
                <div className="rounded-[10px] border border-card-border px-[14px] py-[10px]">
                    <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                        Resultados · {sel.lab.number}
                    </div>
                    <LabResultsList results={sel.lab.results} />
                    {sel.lab.results.some((r) => r.out_of_range) && (
                        <div className="mt-1 text-[11.5px] text-muted">
                            * Fuera del rango de referencia.
                        </div>
                    )}
                </div>
            )}

            {/* Imagen entry */}
            {sel.type === 'imagen' && sel.imaging && (
                <div className="rounded-[10px] border border-card-border px-[14px] py-[10px]">
                    <div className="mb-1 text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                        Informe · {sel.imaging.number}
                    </div>
                    <ImagingReportBlock report={sel.imaging} />
                </div>
            )}

            {/* Alta entry */}
            {sel.type === 'alta' && sel.discharge && (
                <DischargeBlock discharge={sel.discharge} />
            )}

            {/* Consulta entry */}
            {sel.type === 'consulta' && (
                <>
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
                            <p className="m-0 text-text-heading">
                                {sel.motivo_consulta}
                            </p>
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

                    {sel.discharge && (
                        <DischargeBlock discharge={sel.discharge} />
                    )}

                    {sel.vitals && <VitalsBlock vitals={sel.vitals} />}

                    {sel.prescription && (
                        <PrescriptionBlock
                            prescription={sel.prescription}
                            canPrint={canPrint}
                        />
                    )}
                </>
            )}
        </div>
    );
}
