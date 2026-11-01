import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { ParameterType } from '../types';

export type ParameterDraft = {
    key: number;
    name: string;
    result_type: ParameterType;
    unit: string;
    min: string;
    max: string;
    normal_text: string;
};

let nextKey = 1;
export const emptyParameter = (): ParameterDraft => ({
    key: nextKey++,
    name: '',
    result_type: 'numerico',
    unit: '',
    min: '',
    max: '',
    normal_text: '',
});

const input =
    'h-9 w-full min-w-0 rounded-lg border border-input-border bg-white px-2 text-[13.5px] outline-none focus:border-primary';

/** Parámetros: name, type and reference (numeric range or normal text) */
export default function ParametersEditor({
    value,
    errors,
    onChange,
}: {
    value: ParameterDraft[];
    errors: Record<string, string>;
    onChange: (rows: ParameterDraft[]) => void;
}) {
    const set = (key: number, patch: Partial<ParameterDraft>) =>
        onChange(value.map((p) => (p.key === key ? { ...p, ...patch } : p)));

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-text-heading">
                    Parámetros y valores de referencia
                </span>
                <button
                    type="button"
                    onClick={() => onChange([...value, emptyParameter()])}
                    className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-primary"
                >
                    <Plus className="h-4 w-4" />
                    Agregar parámetro
                </button>
            </div>
            {errors.parameters && (
                <span className="text-xs text-error">{errors.parameters}</span>
            )}
            {value.map((p, i) => (
                <div
                    key={p.key}
                    className="grid grid-cols-[1.6fr_110px_1fr_auto] items-start gap-2 rounded-[10px] border border-card-border p-2"
                >
                    <div>
                        <input
                            aria-label={`Parámetro ${i + 1}`}
                            placeholder="Ej.: Hemoglobina"
                            value={p.name}
                            onChange={(e) =>
                                set(p.key, { name: e.target.value })
                            }
                            className={input}
                        />
                        {errors[`parameters.${i}.name`] && (
                            <span className="text-xs text-error">
                                {errors[`parameters.${i}.name`]}
                            </span>
                        )}
                    </div>
                    <select
                        aria-label={`Tipo del parámetro ${i + 1}`}
                        value={p.result_type}
                        onChange={(e) =>
                            set(p.key, {
                                result_type: e.target.value as ParameterType,
                            })
                        }
                        className={input}
                    >
                        <option value="numerico">Numérico</option>
                        <option value="texto">Texto</option>
                    </select>
                    {p.result_type === 'numerico' ? (
                        <div className="grid grid-cols-3 gap-1">
                            <input
                                aria-label={`Mínimo del parámetro ${i + 1}`}
                                placeholder="Mín."
                                inputMode="decimal"
                                value={p.min}
                                onChange={(e) =>
                                    set(p.key, { min: e.target.value })
                                }
                                className={input}
                            />
                            <input
                                aria-label={`Máximo del parámetro ${i + 1}`}
                                placeholder="Máx."
                                inputMode="decimal"
                                value={p.max}
                                onChange={(e) =>
                                    set(p.key, { max: e.target.value })
                                }
                                className={input}
                            />
                            <input
                                aria-label={`Unidad del parámetro ${i + 1}`}
                                placeholder="Unidad"
                                value={p.unit}
                                onChange={(e) =>
                                    set(p.key, { unit: e.target.value })
                                }
                                className={input}
                            />
                            {errors[`parameters.${i}.max`] && (
                                <span className="col-span-3 text-xs text-error">
                                    {errors[`parameters.${i}.max`]}
                                </span>
                            )}
                        </div>
                    ) : (
                        <input
                            aria-label={`Valor normal del parámetro ${i + 1}`}
                            placeholder="Valor normal, ej.: Negativo"
                            value={p.normal_text}
                            onChange={(e) =>
                                set(p.key, { normal_text: e.target.value })
                            }
                            className={input}
                        />
                    )}
                    <button
                        type="button"
                        aria-label={`Quitar parámetro ${i + 1}`}
                        disabled={value.length === 1}
                        onClick={() =>
                            onChange(value.filter((x) => x.key !== p.key))
                        }
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error-bg hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
