import React from 'react';
import {
    computeImcFromMetric,
    lbToKgTimes10,
    feetInchesToCm,
} from '@/lib/units';
import { NoteFormData } from '../types';

// ─── Signos Vitales ───────────────────────────────────────────────────────────

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

type SimpleVitalKey = (typeof SIMPLE_VITALS)[number]['key'];

type Props = {
    form: Pick<
        NoteFormData,
        SimpleVitalKey | 'pesoLb' | 'tallaPies' | 'tallaPulgadas'
    >;
    onChange: (patch: Partial<NoteFormData>) => void;
    errors?: { peso?: string; talla?: string };
};

const inputCls =
    'w-full min-w-0 flex-1 border-0 bg-transparent p-0 font-sans text-sm font-semibold text-text-heading tabular-nums outline-none';

export default function SignosVitales({ form, onChange, errors }: Props) {
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

    return (
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
                                    onChange({ [v.key]: e.target.value })
                                }
                                className={inputCls}
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
                                onChange({ pesoLb: e.target.value })
                            }
                            className={inputCls}
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
                    {errors?.peso && (
                        <span className="text-[11px] text-error">
                            {errors.peso}
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
                                onChange({ tallaPies: e.target.value })
                            }
                            className={inputCls}
                        />
                        <span className="text-[11.5px] whitespace-nowrap text-muted-light">
                            ft
                        </span>
                    </span>
                    {form.tallaPies &&
                        (Number(form.tallaPies) < 1 ||
                            Number(form.tallaPies) > 7) && (
                            <span className="text-[11px] text-error">
                                1–7 ft
                            </span>
                        )}
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
                                onChange({ tallaPulgadas: e.target.value })
                            }
                            className={inputCls}
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
                    {errors?.talla && (
                        <span className="text-[11px] text-error">
                            {errors.talla}
                        </span>
                    )}
                </label>

                {/* IMC (auto-computed) */}
                <div className="flex flex-col gap-[2px] rounded-[10px] border border-dashed border-input-border bg-done-row-bg px-[10px] py-[6px]">
                    <span className="text-[12px] text-muted">IMC</span>
                    <span className="text-sm font-semibold text-text-heading tabular-nums">
                        {imc.display}
                    </span>
                </div>
            </div>
        </div>
    );
}
