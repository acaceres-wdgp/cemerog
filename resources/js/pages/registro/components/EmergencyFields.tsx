import React from 'react';
import { Siren } from 'lucide-react';
import { formatMoney } from '@/lib/money';

export type FreeCubicle = { id: number; name: string };

/** «Emergencia»: notice and the free cubicle (doctor and reason are shared with consulta) */
export default function EmergencyFields({
    cubicles,
    fee,
    cubicleId,
    onCubicle,
    error,
}: {
    cubicles: FreeCubicle[];
    fee: number;
    cubicleId: number | string;
    onCubicle: (id: string) => void;
    error?: string;
}) {
    return (
        <div className="mb-4 flex flex-col gap-3">
            <div className="state-emergencia flex items-start gap-2 rounded-[10px] bg-[var(--state-bg)] px-3 py-2 text-[13px] text-[var(--state-text)]">
                <Siren className="mt-0.5 h-4 w-4 flex-none" />
                <span>
                    Pasa directo al cubículo para atención inmediata. No se
                    asigna turno. Se carga la tarifa de Emergencia (
                    {formatMoney(fee)}).
                </span>
            </div>
            <div className="sm:max-w-[50%] sm:pr-2">
                <label
                    htmlFor="field-cubicle"
                    className="mb-1 block text-[13px] font-medium text-text-body"
                >
                    Cubículo <span className="text-error">*</span>
                </label>
                {cubicles.length === 0 ? (
                    <p className="m-0 rounded-lg bg-error-bg px-3 py-2 text-[13px] text-error-strong">
                        No hay cubículos libres en Emergencia en este momento.
                    </p>
                ) : (
                    <select
                        id="field-cubicle"
                        value={cubicleId}
                        onChange={(e) => onCubicle(e.target.value)}
                        className="h-9 w-full rounded-lg border border-card-border bg-white px-3 text-sm outline-none focus:border-primary"
                    >
                        <option value="">— Seleccionar cubículo libre —</option>
                        {cubicles.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                )}
                {error && (
                    <p className="mt-1 text-[12px] text-error">{error}</p>
                )}
            </div>
        </div>
    );
}
