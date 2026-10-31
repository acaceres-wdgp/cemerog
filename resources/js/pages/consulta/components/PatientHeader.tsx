import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { initials } from '../lib/helpers';
import { TurnItem } from '../types';
import { ageLabel } from '@/lib/patient';

// ─── Patient Header ───────────────────────────────────────────────────────────

export default function PatientHeader({ turn }: { turn: TurnItem }) {
    const p = turn.patient;
    const d = turn.doctor;
    const arrivedAt = new Date(turn.arrived_at);

    return (
        <div className="overflow-hidden rounded-2xl border border-card-border bg-white shadow-[0_10px_24px_-16px_rgba(16,40,24,.25)]">
            <div className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary text-[17px] font-semibold text-white shadow-[0_0_0_4px_theme(colors.accent-bg)]">
                    {initials(p.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-[10px]">
                        <span className="font-serif text-[21px] font-semibold text-text-heading">
                            {p.full_name}
                        </span>
                        <StatusBadge state="consulta" />
                    </div>
                    <div className="mt-[6px] flex flex-wrap gap-[6px]">
                        {[
                            ageLabel(p.age),
                            p.sex === 'M' ? 'Masculino' : 'Femenino',
                        ].map((v) => (
                            <span
                                key={v}
                                className="inline-flex h-6 items-center rounded-full bg-surface px-[10px] text-[12.5px] text-text-dim"
                            >
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
                {p.allergies && (
                    <div className="flex items-center gap-[10px] rounded-xl border border-error-border bg-error-bg py-2 pr-4 pl-2 text-error">
                        <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-emergencia-dot text-[17px] text-white">
                            ⚠
                        </span>
                        <div className="leading-[1.25]">
                            <div className="text-[11px] font-semibold tracking-[.05em] uppercase">
                                Alergias
                            </div>
                            <div className="font-semibold">{p.allergies}</div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex flex-wrap border-t border-divider bg-patient-footer-bg">
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
                        className="min-w-0 flex-1 border-r border-divider px-5 py-[10px]"
                    >
                        <div className="text-[11px] font-semibold tracking-[.05em] text-muted uppercase">
                            {f.label}
                        </div>
                        <div className="overflow-hidden font-semibold text-ellipsis whitespace-nowrap tabular-nums">
                            {f.val}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
