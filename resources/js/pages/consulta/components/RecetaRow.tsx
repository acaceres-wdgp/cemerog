import React from 'react';
import type { RxRow } from './RecetaTab';

// ─── RecetaRow ────────────────────────────────────────────────────────────────

type Props = {
    row: RxRow;
    index: number;
    disabled: boolean;
    /** Required fields still missing (marked in red) */
    invalid?: (keyof RxRow)[];
    /** The quantity was computed from dose, frequency and days */
    quantityComputed?: boolean;
    onChange: (patch: Partial<RxRow>) => void;
    onRemove: () => void;
};

export default function RecetaRow({
    row,
    index,
    disabled,
    invalid = [],
    quantityComputed = false,
    onChange,
    onRemove,
}: Props) {
    const base =
        'h-[34px] w-full rounded-lg border px-[10px] font-sans text-[13.5px] outline-none disabled:bg-surface disabled:text-muted';
    // Red border on a required field that is still missing
    const field = (name: keyof RxRow) =>
        invalid.includes(name)
            ? {
                  className: `${base} border-error bg-error-bg`,
                  'aria-invalid': true as const,
              }
            : { className: `${base} border-input-border` };

    return (
        <tr>
            <td className="border-b border-divider p-2 pl-[18px] align-top">
                <input
                    value={row.medication}
                    onChange={(e) => onChange({ medication: e.target.value })}
                    disabled={disabled}
                    placeholder="Medicamento"
                    {...field('medication')}
                    aria-label={`Medicamento ${index + 1}`}
                />
            </td>
            <td className="border-b border-divider p-2 align-top">
                <input
                    value={row.route}
                    onChange={(e) => onChange({ route: e.target.value })}
                    disabled={disabled}
                    placeholder="Vía"
                    {...field('route')}
                    aria-label={`Vía ${index + 1}`}
                />
            </td>
            <td className="border-b border-divider p-2 align-top">
                <input
                    value={row.dose}
                    onChange={(e) => onChange({ dose: e.target.value })}
                    disabled={disabled}
                    placeholder="Dosis"
                    {...field('dose')}
                    aria-label={`Dosis ${index + 1}`}
                />
            </td>
            <td className="border-b border-divider p-2 align-top">
                <input
                    value={row.frequency}
                    onChange={(e) => onChange({ frequency: e.target.value })}
                    disabled={disabled}
                    placeholder="Frecuencia"
                    {...field('frequency')}
                    aria-label={`Frecuencia ${index + 1}`}
                />
            </td>
            <td className="border-b border-divider p-2 align-top">
                <div className="flex flex-col gap-[5px]">
                    <input
                        value={row.duration_days}
                        onChange={(e) =>
                            onChange({ duration_days: e.target.value })
                        }
                        disabled={disabled || row.is_continuous}
                        placeholder="días"
                        {...field('duration_days')}
                        aria-label={`Duración ${index + 1}`}
                        type="number"
                        min={1}
                    />
                    <label className="flex cursor-pointer items-center gap-[6px] text-[12.5px] text-muted">
                        <input
                            type="checkbox"
                            checked={row.is_continuous}
                            onChange={(e) =>
                                onChange({ is_continuous: e.target.checked })
                            }
                            disabled={disabled}
                            aria-label="Continuo"
                        />
                        Continuo
                    </label>
                </div>
            </td>
            <td className="border-b border-divider p-2 align-top">
                <input
                    value={row.quantity}
                    onChange={(e) => onChange({ quantity: e.target.value })}
                    disabled={disabled}
                    placeholder="Cant."
                    {...field('quantity')}
                    aria-label={`Cantidad ${index + 1}`}
                    type="number"
                    min={1}
                />
                {quantityComputed && (
                    <div
                        className="mt-[5px] text-[12px] text-muted"
                        title="Dosis × veces al día × días. Puedes cambiarla."
                    >
                        Calculada
                    </div>
                )}
            </td>
            <td className="border-b border-divider p-2 text-center align-top">
                <button
                    onClick={onRemove}
                    disabled={disabled}
                    aria-label="Eliminar medicamento"
                    className="h-[34px] w-[34px] cursor-pointer rounded-lg border-0 bg-transparent text-[16px] text-muted disabled:cursor-not-allowed disabled:opacity-40"
                >
                    🗑
                </button>
            </td>
        </tr>
    );
}
