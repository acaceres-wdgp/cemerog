import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import emergenciaRoutes from '@/routes/emergencia';
import { primaryBtn, secondaryBtn } from './card';

const FIELDS = [
    ['presion_arterial', 'Presión arterial', 'mmHg', '120/80', true],
    ['frecuencia_cardiaca', 'Frec. cardíaca', 'lpm', '80', true],
    ['frecuencia_respiratoria', 'Frec. resp.', 'rpm', '16', true],
    ['temp', 'Temperatura', '°C', '36.8', true],
    ['saturacion_o2', 'SpO₂', '%', '98', true],
    ['glucemia', 'Glucemia', 'mg/dL', '—', false],
] as const;

type Key = (typeof FIELDS)[number][0];

/** «Nueva toma»: recorded with the current time and the user */
export default function VitalsForm({
    emergencyId,
    onDone,
    url,
}: {
    emergencyId: number;
    onDone: () => void;
    /** Internamiento posts to its own route */
    url?: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [values, setValues] = useState<Record<Key, string>>({
        presion_arterial: '',
        frecuencia_cardiaca: '',
        frecuencia_respiratoria: '',
        temp: '',
        saturacion_o2: '',
        glucemia: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const complete = FIELDS.every(([k, , , , req]) => !req || values[k] !== '');

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const n = (v: string) => (v.trim() === '' ? null : Number(v));
        router.post(
            url ?? emergenciaRoutes.vitals.store.url(emergencyId),
            {
                presion_arterial: values.presion_arterial.trim(),
                frecuencia_cardiaca: n(values.frecuencia_cardiaca),
                frecuencia_respiratoria: n(values.frecuencia_respiratoria),
                temp: n(values.temp),
                saturacion_o2: n(values.saturacion_o2),
                glucemia: n(values.glucemia),
            },
            {
                preserveScroll: true,
                onSuccess: onDone,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <form
            onSubmit={submit}
            className="flex flex-col gap-3 border-b border-divider bg-list-row-bg px-5 py-4"
        >
            <div className="text-[13px] text-muted">
                Nueva toma · se registra con la hora actual
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
                {FIELDS.map(([key, label, unit, placeholder, required]) => (
                    <label
                        key={key}
                        className="flex flex-col gap-1 text-[13px]"
                    >
                        <span className="font-medium text-text-heading">
                            {label}
                            {required && <span className="text-error"> *</span>}
                        </span>
                        <span className="flex h-9 items-center rounded-[10px] border border-input-border bg-white focus-within:border-primary">
                            <input
                                aria-label={label}
                                inputMode="decimal"
                                placeholder={placeholder}
                                value={values[key]}
                                onChange={(e) =>
                                    setValues((v) => ({
                                        ...v,
                                        [key]: e.target.value,
                                    }))
                                }
                                className="w-full min-w-0 border-0 bg-transparent px-3 tabular-nums outline-none"
                            />
                            <span className="pr-3 text-[12px] text-muted">
                                {unit}
                            </span>
                        </span>
                        {errors[key] && (
                            <span className="text-xs text-error">
                                {errors[key]}
                            </span>
                        )}
                    </label>
                ))}
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onDone} className={secondaryBtn}>
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={!complete || isLoading}
                    className={primaryBtn}
                >
                    <Check className="h-4 w-4" />
                    Guardar toma
                </button>
            </div>
        </form>
    );
}
