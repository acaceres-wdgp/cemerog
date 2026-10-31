import React from 'react';
import FormField from '@/components/cemerog/FormField';
import { cn } from '@/lib/utils';

/** The discount is always a whole percentage (1–100) of the subtotal */
export type DiscountState = {
    percent: string;
    reason: string;
};

export const initialDiscount = (): DiscountState => ({
    percent: '',
    reason: '',
});

const QUICK = [5, 10, 15, 20, 50, 100];

/** Discount in centavos; 0 when empty, null when the percentage is invalid */
export function computeDiscount(
    subtotal: number,
    percent: string,
): number | null {
    if (percent.trim() === '') return 0;
    const pct = Number(percent);
    if (!Number.isInteger(pct) || pct < 0 || pct > 100) return null;
    return Math.round((subtotal * pct) / 100);
}

const hasDiscount = (d: DiscountState) => Number(d.percent) > 0;

/** A discount needs a valid percentage and a reason */
export function discountIsValid(d: DiscountState, subtotal: number): boolean {
    if (computeDiscount(subtotal, d.percent) === null) return false;
    return !hasDiscount(d) || d.reason.trim() !== '';
}

export function discountPayload(d: DiscountState) {
    if (!hasDiscount(d)) return {};
    return {
        discount_type: 'porcentaje',
        discount_value: Number(d.percent),
        discount_reason: d.reason.trim(),
    };
}

export default function DiscountFields({
    state,
    subtotal,
    errors,
    onChange,
}: {
    state: DiscountState;
    subtotal: number;
    errors: Record<string, string>;
    onChange: (patch: Partial<DiscountState>) => void;
}) {
    const amount = computeDiscount(subtotal, state.percent);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
                <FormField
                    name="discount_value"
                    label="Descuento (%)"
                    inputMode="numeric"
                    placeholder="0"
                    value={state.percent}
                    onChange={(e) =>
                        onChange({ percent: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-[140px]"
                    error={
                        errors.discount_value ??
                        (amount === null ? 'Entre 0% y 100%.' : undefined)
                    }
                />
                <div className="flex flex-wrap gap-[6px] pb-[2px]">
                    {QUICK.map((pct) => {
                        const active = state.percent === String(pct);
                        return (
                            <button
                                key={pct}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                    onChange({
                                        percent: active ? '' : String(pct),
                                    })
                                }
                                className={cn(
                                    'h-8 cursor-pointer rounded-[8px] border px-[10px] text-[13px] font-semibold',
                                    active
                                        ? 'border-primary bg-accent-bg text-primary'
                                        : 'border-input-border bg-card text-text-secondary',
                                )}
                            >
                                {pct}%
                            </button>
                        );
                    })}
                </div>
            </div>
            {hasDiscount(state) && amount !== null && (
                <FormField
                    as="textarea"
                    name="discount_reason"
                    label="Motivo del descuento"
                    rows={2}
                    value={state.reason}
                    onChange={(e) => onChange({ reason: e.target.value })}
                    error={errors.discount_reason}
                    required
                />
            )}
        </div>
    );
}
