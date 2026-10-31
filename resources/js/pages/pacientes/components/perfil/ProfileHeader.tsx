import React from 'react';
import { TriangleAlert } from 'lucide-react';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { Antecedentes, Finanzas, ProfilePatient } from './types';
import { SEX_LABELS } from './types';

function Stat({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string;
    tone?: 'default' | 'danger' | 'ok';
}) {
    return (
        <div
            className={cn(
                'min-w-[150px] flex-1 rounded-[12px] border px-4 py-3',
                tone === 'danger'
                    ? 'border-error-border bg-error-bg'
                    : tone === 'ok'
                      ? 'border-accent-border bg-accent-bg'
                      : 'border-card-border bg-white',
            )}
        >
            <p className="text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                {label}
            </p>
            <p
                className={cn(
                    'mt-1 font-serif text-[20px] font-semibold tabular-nums',
                    tone === 'danger'
                        ? 'text-error'
                        : tone === 'ok'
                          ? 'text-accent-fg'
                          : 'text-text-heading',
                )}
            >
                {value}
            </p>
        </div>
    );
}

export default function ProfileHeader({
    patient,
    antecedentes,
    stats,
    finanzas,
}: {
    patient: ProfilePatient;
    antecedentes: Antecedentes;
    stats: { atenciones: number; ultima_atencion: string | null };
    finanzas: Finanzas | null;
}) {
    const sex = SEX_LABELS[patient.sex] ?? patient.sex;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-card-border bg-white px-5 py-4">
                {patient.photo_url ? (
                    <img
                        src={patient.photo_url}
                        alt=""
                        className="h-[56px] w-[56px] shrink-0 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full bg-accent-bg text-[19px] font-semibold text-accent-fg">
                        {patient.initials}
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <h1 className="m-0 font-serif text-[22px] font-semibold text-text-heading">
                        {patient.full_name}
                    </h1>
                    <p className="mt-0.5 text-[13px] text-muted">
                        {sex} · {patient.age} años · Expediente{' '}
                        {patient.expediente_number}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-[6px]">
                        <span className="rounded-full bg-muted-bg px-[10px] py-[2px] text-[12px] font-semibold text-text-body">
                            Sangre {patient.blood_type ?? '—'}
                        </span>
                        {patient.allergies ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-error-border bg-error-bg px-[10px] py-[2px] text-[12px] font-semibold text-error">
                                <TriangleAlert className="h-3 w-3" />
                                Alergia: {patient.allergies}
                            </span>
                        ) : (
                            <span className="rounded-full bg-muted-bg px-[10px] py-[2px] text-[12px] text-muted">
                                Sin alergias conocidas
                            </span>
                        )}
                        {antecedentes.personales && (
                            <StatusBadge
                                state="espera"
                                label={antecedentes.personales}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <Stat label="Atenciones" value={String(stats.atenciones)} />
                <Stat
                    label="Última atención"
                    value={stats.ultima_atencion ?? '—'}
                />
                {finanzas && (
                    <>
                        <Stat
                            label="Total cargado"
                            value={formatMoney(finanzas.total_cargado)}
                        />
                        <Stat
                            label="Pendiente de facturar"
                            value={
                                finanzas.pendiente_facturar > 0
                                    ? formatMoney(finanzas.pendiente_facturar)
                                    : 'Al día'
                            }
                            tone={
                                finanzas.pendiente_facturar > 0
                                    ? 'danger'
                                    : 'ok'
                            }
                        />
                    </>
                )}
            </div>
        </div>
    );
}
