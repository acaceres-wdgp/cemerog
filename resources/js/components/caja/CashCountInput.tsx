import React from 'react';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { formatMoney, parseMoney } from '@/lib/money';

/** Dominican peso bills and coins, largest first (same as the backend) */
export const DENOMINATIONS = [2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];

export type CashCountMode = 'monto' | 'denominacion';

export type CashCount = {
    mode: CashCountMode;
    /** Typed amount in pesos, as the user wrote it */
    amount: string;
    /** Units per face value in pesos */
    units: Record<number, string>;
};

export const emptyCashCount = (): CashCount => ({
    mode: 'monto',
    amount: '',
    units: {},
});

/** Total of a count in centavos */
export function cashCountTotal(count: CashCount): number {
    if (count.mode === 'monto') return parseMoney(count.amount);
    return DENOMINATIONS.reduce(
        (sum, value) =>
            sum + value * 100 * (parseInt(count.units[value] ?? '', 10) || 0),
        0,
    );
}

/** Request fields for a count: a total, or the units by denomination */
export function cashCountPayload(
    count: CashCount,
    amountField: string,
): Record<string, number | Record<string, number>> {
    if (count.mode === 'monto') {
        return { [amountField]: parseMoney(count.amount) };
    }
    const denominations: Record<string, number> = {};
    for (const value of DENOMINATIONS) {
        const units = parseInt(count.units[value] ?? '', 10) || 0;
        if (units > 0) denominations[String(value)] = units;
    }
    return { denominations };
}

export default function CashCountInput({
    label,
    count,
    onChange,
    error,
}: {
    label: string;
    count: CashCount;
    onChange: (count: CashCount) => void;
    error?: string;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-text-heading">
                    {label}
                </span>
                <SegmentedControl<CashCountMode>
                    segments={[
                        { value: 'monto', label: 'Por monto' },
                        { value: 'denominacion', label: 'Por denominación' },
                    ]}
                    value={count.mode}
                    onChange={(mode) => onChange({ ...count, mode })}
                />
            </div>

            {count.mode === 'monto' ? (
                <FormField
                    name="amount"
                    label="Monto (RD$)"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={count.amount}
                    error={error}
                    onChange={(e) =>
                        onChange({ ...count, amount: e.target.value })
                    }
                />
            ) : (
                <>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                        {DENOMINATIONS.map((value) => (
                            <label
                                key={value}
                                className="flex flex-col gap-1 rounded-[10px] border border-input-border bg-white px-3 py-2"
                            >
                                <span className="text-[12px] text-muted">
                                    RD${value.toLocaleString('en-US')}
                                </span>
                                <input
                                    inputMode="numeric"
                                    aria-label={`Cantidad de RD$${value}`}
                                    value={count.units[value] ?? ''}
                                    onChange={(e) =>
                                        onChange({
                                            ...count,
                                            units: {
                                                ...count.units,
                                                [value]: e.target.value.replace(
                                                    /\D/g,
                                                    '',
                                                ),
                                            },
                                        })
                                    }
                                    className="w-full border-0 bg-transparent p-0 text-sm font-semibold text-text-heading tabular-nums outline-none"
                                    placeholder="0"
                                />
                            </label>
                        ))}
                    </div>
                    {error && <p className="text-xs text-error">{error}</p>}
                </>
            )}

            <p className="text-[13px] text-muted">
                Total:{' '}
                <span className="font-semibold text-text-heading tabular-nums">
                    {formatMoney(cashCountTotal(count))}
                </span>
            </p>
        </div>
    );
}
