import React from 'react';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { parseMoney } from '@/lib/money';

export type DiscountType = 'porcentaje' | 'monto';

export type DiscountState = {
    enabled: boolean;
    type: DiscountType;
    value: string;
    reason: string;
};

export const initialDiscount = (): DiscountState => ({
    enabled: false,
    type: 'porcentaje',
    value: '',
    reason: '',
});

/** Discount in centavos; null when the typed value is invalid */
export function computeDiscount(
    subtotal: number,
    type: DiscountType,
    value: string,
): number | null {
    if (value.trim() === '') return 0;
    if (type === 'porcentaje') {
        const pct = Number(value);
        if (!Number.isInteger(pct) || pct < 1 || pct > 100) return null;
        return Math.round((subtotal * pct) / 100);
    }
    const amount = parseMoney(value);
    if (amount < 1 || amount > subtotal) return null;
    return amount;
}

export function discountAmount(
    d: DiscountState,
    subtotal: number,
): number | null {
    return d.enabled ? computeDiscount(subtotal, d.type, d.value) : 0;
}

/** A discount needs a valid value and a reason */
export function discountIsValid(d: DiscountState, subtotal: number): boolean {
    if (!d.enabled) return true;
    const amount = discountAmount(d, subtotal);
    return amount !== null && amount > 0 && d.reason.trim() !== '';
}

export function discountPayload(d: DiscountState) {
    if (!d.enabled) return {};
    return {
        discount_type: d.type,
        discount_value:
            d.type === 'porcentaje' ? Number(d.value) : parseMoney(d.value),
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
    const amount = discountAmount(state, subtotal);

    return (
        <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-[14px] font-medium text-text-heading">
                <input
                    type="checkbox"
                    checked={state.enabled}
                    onChange={(e) => onChange({ enabled: e.target.checked })}
                />
                Aplicar descuento
            </label>
            {state.enabled && (
                <div className="flex flex-col gap-3 rounded-[12px] border border-card-border bg-app-bg px-4 py-3">
                    <SegmentedControl<DiscountType>
                        segments={[
                            { value: 'porcentaje', label: 'Porcentaje' },
                            { value: 'monto', label: 'Monto' },
                        ]}
                        value={state.type}
                        onChange={(type) => onChange({ type, value: '' })}
                        className="self-start"
                    />
                    <FormField
                        name="discount_value"
                        label={
                            state.type === 'porcentaje'
                                ? 'Porcentaje (1 a 100)'
                                : 'Monto (RD$)'
                        }
                        inputMode="decimal"
                        value={state.value}
                        onChange={(e) => onChange({ value: e.target.value })}
                        error={
                            errors.discount_value ??
                            (amount === null
                                ? state.type === 'porcentaje'
                                    ? 'Escribe un porcentaje entero entre 1 y 100.'
                                    : 'El monto no puede ser mayor que el total.'
                                : undefined)
                        }
                    />
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
                </div>
            )}
        </div>
    );
}
