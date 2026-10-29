import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { formatPesoLb, formatTallaFtIn, computeImcFromMetric } from '@/lib/units';
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
            <div className="mt-2 overflow-hidden rounded-[14px] border border-card-border bg-white">
                <div className="border-b border-divider px-5 py-[14px]">
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Historial en la clínica
                    </div>
                    <div className="text-[13px] text-muted">0 registros</div>
                </div>
                <div className="px-6 py-12 text-center text-muted">
                    <div className="mb-[10px] text-[32px]">📋</div>
                    <div className="mb-1 text-[14px] font-semibold text-secondary-fg">
                        Sin historial registrado
                    </div>
                    <p className="m-0 text-[13px]">
                        Las consultas guardadas de este paciente aparecerán
                        aquí.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-2 overflow-hidden rounded-[14px] border border-card-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-[14px]">
                <div>
                    <div className="font-serif text-[16px] font-semibold text-text-heading">
                        Historial en la clínica
                    </div>
                    <div className="text-[13px] text-muted">
                        {historial.length} registros
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-stretch">
                {/* Left list */}
                <div className="max-h-[400px] min-w-0 flex-[1_1_320px] overflow-y-auto border-r border-divider">
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
                                className={cn(
                                    'flex w-full cursor-pointer items-start gap-3 border-0 border-b border-row-separator px-5 py-3 text-left',
                                    e.id === selId
                                        ? 'bg-list-row-bg'
                                        : 'bg-white',
                                )}
                            >
                                <span className="w-[3px] shrink-0 self-stretch rounded-sm bg-consulta-dot" />
                                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                                        <span className="rounded-full bg-badge-consulta-bg px-2 py-[1px] font-semibold text-consulta-num">
                                            Consulta
                                        </span>
                                        <span className="text-muted tabular-nums">
                                            {dateStr}
                                        </span>
                                    </div>
                                    <div className="text-[13.5px] font-semibold text-text-heading">
                                        {dx0
                                            ? `${dx0.code} – ${dx0.label}`
                                            : (e.motivo_consulta ??
                                              'Sin diagnóstico')}
                                    </div>
                                    <div className="text-[12px] text-muted">
                                        {e.doctor.full_name} ·{' '}
                                        {e.doctor.specialty ?? ''}
                                    </div>
                                </div>
                                <span className="mt-[2px] shrink-0 text-[15px] text-muted-light">
                                    ›
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Right detail */}
                <div className="flex min-w-0 flex-[2_1_480px] flex-col gap-4 p-5 px-6 text-[13.5px]">
                    {sel ? (
                        <>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-badge-consulta-bg px-[10px] py-[2px] text-[12px] font-semibold text-consulta-num">
                                    Consulta
                                </span>
                                <span className="text-[12.5px] text-muted">
                                    {format(
                                        new Date(sel.consulted_at),
                                        'dd/MM/yyyy HH:mm',
                                        { locale: es },
                                    )}
                                </span>
                            </div>
                            <div className="font-serif text-[19px] font-semibold text-text-heading">
                                {sel.diagnosticos?.[0]
                                    ? `${sel.diagnosticos[0].code} – ${sel.diagnosticos[0].label}`
                                    : (sel.motivo_consulta ??
                                      'Sin diagnóstico')}
                            </div>
                            <div className="text-text-dim">
                                {sel.doctor.full_name} · {sel.doctor.specialty}
                            </div>

                            {sel.diagnosticos &&
                                sel.diagnosticos.length > 0 && (
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

                            {/* Signos vitales del registro histórico */}
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
                                                    {computeImcFromMetric(
                                                        sel.vitals.peso,
                                                        sel.vitals.talla,
                                                    ).display}
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
                        </>
                    ) : (
                        <div className="py-10 text-center text-muted">
                            Selecciona un registro para ver el detalle.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
