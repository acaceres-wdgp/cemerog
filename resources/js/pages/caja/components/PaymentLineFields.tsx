import React from 'react';
import FormField from '@/components/cemerog/FormField';
import { formatMoney, parseMoney } from '@/lib/money';
import { METHOD_LABELS } from '../types';
import type { PaymentMethod } from '../types';

export type Line = {
    method: PaymentMethod;
    amount: string;
    received: string;
    reference: string;
};

const METHODS: PaymentMethod[] = ['efectivo', 'tarjeta', 'transferencia'];

/** One method of a payment: cash with the change, card or transfer */
export default function PaymentLineFields({
    index,
    line,
    removable,
    errors,
    onChange,
    onRemove,
}: {
    index: number;
    line: Line;
    removable: boolean;
    errors: Record<string, string>;
    onChange: (patch: Partial<Line>) => void;
    onRemove: () => void;
}) {
    const change =
        line.method === 'efectivo' && line.received.trim() !== ''
            ? parseMoney(line.received) - parseMoney(line.amount)
            : null;

    return (
        <div className="flex flex-col gap-2 rounded-xl border border-card-border bg-app-bg px-4 py-3">
            <div className="flex flex-wrap items-end gap-2">
                <FormField
                    as="select"
                    name={`method_${index}`}
                    label="Método"
                    value={line.method}
                    onChange={(e) =>
                        onChange({ method: e.target.value as PaymentMethod })
                    }
                    className="min-w-[150px] flex-1"
                >
                    {METHODS.map((m) => (
                        <option key={m} value={m}>
                            {METHOD_LABELS[m]}
                        </option>
                    ))}
                </FormField>
                <FormField
                    name={`amount_${index}`}
                    label="Monto (RD$)"
                    inputMode="decimal"
                    value={line.amount}
                    onChange={(e) => onChange({ amount: e.target.value })}
                    className="min-w-[140px] flex-1"
                />
                {removable && (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="h-9 cursor-pointer rounded-lg border border-card-border bg-white px-3 text-[13px] text-muted"
                        aria-label={`Quitar ${METHOD_LABELS[line.method]}`}
                    >
                        Quitar
                    </button>
                )}
            </div>
            {line.method === 'efectivo' && (
                <FormField
                    name={`received_${index}`}
                    label="Efectivo recibido (RD$)"
                    inputMode="decimal"
                    placeholder="Igual al monto"
                    value={line.received}
                    onChange={(e) => onChange({ received: e.target.value })}
                    error={
                        errors[`payments.${index}.cash_received`] ??
                        (change !== null && change < 0
                            ? 'Es menor que el monto a pagar.'
                            : undefined)
                    }
                    help={
                        change !== null && change >= 0
                            ? `Devuelta: ${formatMoney(change)}`
                            : undefined
                    }
                />
            )}
            {line.method === 'transferencia' && (
                <FormField
                    name={`reference_${index}`}
                    label="Número de la transferencia"
                    value={line.reference}
                    onChange={(e) => onChange({ reference: e.target.value })}
                    error={errors[`payments.${index}.reference`]}
                    required
                />
            )}
            {line.method === 'tarjeta' && (
                <FormField
                    name={`reference_${index}`}
                    label="Número de aprobación (opcional)"
                    value={line.reference}
                    onChange={(e) => onChange({ reference: e.target.value })}
                />
            )}
        </div>
    );
}
