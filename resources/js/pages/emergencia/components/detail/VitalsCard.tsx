import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VitalReading } from '../../types';
import { cardCls, headCls, secondaryBtn, td, th, titleCls } from './card';
import VitalsForm from './VitalsForm';

const COLUMNS: [keyof VitalReading, string][] = [
    ['presion_arterial', 'Presión art.'],
    ['frecuencia_cardiaca', 'Frec. card.'],
    ['frecuencia_respiratoria', 'Frec. resp.'],
    ['temp', 'Temp.'],
    ['saturacion_o2', 'SpO₂'],
    ['glucemia', 'Glucemia'],
];

const LATEST: [keyof VitalReading, string, string][] = [
    ['presion_arterial', 'Presión arterial', 'mmHg'],
    ['frecuencia_cardiaca', 'Frec. cardíaca', 'lpm'],
    ['frecuencia_respiratoria', 'Frec. resp.', 'rpm'],
    ['temp', 'Temperatura', '°C'],
    ['saturacion_o2', 'SpO₂', '%'],
    ['glucemia', 'Glucemia', 'mg/dL'],
];

/** Signos vitales: every reading stays recorded */
export default function VitalsCard({
    emergencyId,
    vitals,
    active,
}: {
    emergencyId: number;
    vitals: VitalReading[];
    active: boolean;
}) {
    const [adding, setAdding] = useState(false);
    const [latest, previous] = vitals;

    return (
        <section className={cn(cardCls, 'overflow-hidden')}>
            <div className={headCls}>
                <div>
                    <h2 className={titleCls}>Signos vitales</h2>
                    <div className="text-[13px] text-muted">
                        {vitals.length === 0
                            ? 'Sin tomas'
                            : `${vitals.length} ${vitals.length === 1 ? 'toma' : 'tomas'} · última ${latest.time}`}
                    </div>
                </div>
                {active && !adding && (
                    <button
                        type="button"
                        onClick={() => setAdding(true)}
                        className={secondaryBtn}
                    >
                        <Activity className="h-4 w-4" />
                        Registrar toma
                    </button>
                )}
            </div>
            {adding && (
                <VitalsForm
                    emergencyId={emergencyId}
                    onDone={() => setAdding(false)}
                />
            )}
            {vitals.length === 0 ? (
                <p className="m-0 px-5 py-6 text-center text-[13px] text-muted">
                    Aún no hay tomas. Usa «Registrar toma» para ingresar los
                    primeros signos vitales.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 px-5 py-4">
                        {LATEST.map(([key, label, unit]) => {
                            const value = latest[key];
                            const before = previous?.[key];
                            const trend =
                                typeof value === 'number' &&
                                typeof before === 'number' &&
                                value !== before
                                    ? value > before
                                        ? '↑'
                                        : '↓'
                                    : '';
                            return (
                                <div
                                    key={key}
                                    className="rounded-[10px] border border-card-border px-3 py-2"
                                >
                                    <div className="text-[12px] text-muted">
                                        {label}
                                    </div>
                                    <div className="text-[18px] font-semibold text-text-heading tabular-nums">
                                        {value ?? '—'}{' '}
                                        <span className="text-[12px] font-normal text-muted">
                                            {unit} {trend}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-[13.5px]">
                            <thead>
                                <tr>
                                    <th className={`${th} pl-5 text-left`}>
                                        Hora
                                    </th>
                                    {COLUMNS.map(([k, label]) => (
                                        <th
                                            key={k}
                                            className={`${th} text-right`}
                                        >
                                            {label}
                                        </th>
                                    ))}
                                    <th className={`${th} pr-5 text-left`}>
                                        Tomado por
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {vitals.map((v) => (
                                    <tr key={v.id}>
                                        <td
                                            className={`${td} pl-5 tabular-nums`}
                                        >
                                            {v.time}
                                        </td>
                                        {COLUMNS.map(([k]) => (
                                            <td
                                                key={k}
                                                className={`${td} text-right tabular-nums`}
                                            >
                                                {v[k] ?? '—'}
                                            </td>
                                        ))}
                                        <td
                                            className={`${td} pr-5 text-text-secondary`}
                                        >
                                            {v.taken_by}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}
