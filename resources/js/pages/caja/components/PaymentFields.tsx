import React from 'react';
import { Info } from 'lucide-react';
import FormField from '@/components/cemerog/FormField';
import { formatMoney, parseMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PaymentMethod } from '../types';

export type Method = PaymentMethod | 'credito';

export type PaymentState = {
    method: Method;
    /** Amount paid now; with credit, the down payment (can be 0) */
    amount: string;
    received: string;
    reference: string;
    /** Method of the down payment when the method is credit */
    downMethod: PaymentMethod;
    dueDate: string;
    note: string;
};

export const initialPayment = (
    balance: number,
    dueDate = '',
): PaymentState => ({
    method: 'efectivo',
    amount: (balance / 100).toFixed(2),
    received: '',
    reference: '',
    downMethod: 'efectivo',
    dueDate,
    note: '',
});

const METHOD_LABELS: Record<Method, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    credito: 'Crédito',
};

/** Method that actually moves money (the down payment's, under credit) */
const moneyMethod = (s: PaymentState): PaymentMethod =>
    s.method === 'credito' ? s.downMethod : s.method;

/** Whether the form can be submitted against the given balance */
export function paymentIsValid(s: PaymentState, balance: number): boolean {
    const amount = parseMoney(s.amount);
    if (amount > balance) return false;
    const method = moneyMethod(s);
    if (amount > 0 && method === 'transferencia' && s.reference.trim() === '')
        return false;
    if (
        amount > 0 &&
        method === 'efectivo' &&
        s.received.trim() !== '' &&
        parseMoney(s.received) < amount
    ) {
        return false;
    }
    if (s.method === 'credito') return s.dueDate !== '' && amount < balance;
    return amount > 0;
}

/** Request fields: the payment line and, under credit, the credit terms */
export function paymentPayload(s: PaymentState) {
    const amount = parseMoney(s.amount);
    const method = moneyMethod(s);
    const payments =
        amount > 0
            ? [
                  {
                      method,
                      amount,
                      ...(method === 'efectivo' && s.received.trim() !== ''
                          ? { cash_received: parseMoney(s.received) }
                          : {}),
                      ...(method !== 'efectivo' && s.reference.trim() !== ''
                          ? { reference: s.reference.trim() }
                          : {}),
                  },
              ]
            : [];
    return {
        payments,
        ...(s.method === 'credito'
            ? { credit: { due_date: s.dueDate, note: s.note.trim() || null } }
            : {}),
    };
}

function MethodButton({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={cn(
                'h-10 cursor-pointer rounded-[10px] border px-3 text-[14px] font-medium',
                active
                    ? 'border-primary bg-accent-bg text-primary'
                    : 'border-input-border bg-white text-text-body hover:bg-secondary-bg',
            )}
        >
            {label}
        </button>
    );
}

/** Monto · Método de pago (and the credit details), following the design */
export default function PaymentFields({
    state,
    balance,
    errors,
    onChange,
}: {
    state: PaymentState;
    balance: number;
    errors: Record<string, string>;
    onChange: (patch: Partial<PaymentState>) => void;
}) {
    const credit = state.method === 'credito';
    const amount = parseMoney(state.amount);
    const method = moneyMethod(state);
    const change =
        method === 'efectivo' && state.received.trim() !== ''
            ? parseMoney(state.received) - amount
            : null;

    return (
        <div className="flex flex-col gap-4">
            <FormField
                name="amount"
                label={
                    credit ? 'Abono inicial (RD$) · puede ser 0' : 'Monto (RD$)'
                }
                inputMode="decimal"
                value={state.amount}
                onChange={(e) => onChange({ amount: e.target.value })}
                error={
                    errors.payments ??
                    (amount > balance
                        ? `No puede pasar del balance (${formatMoney(balance)}).`
                        : undefined)
                }
                required={!credit}
            />

            <div className="flex flex-col gap-2">
                <span className="text-[14px] font-medium text-text-heading">
                    Método de pago
                </span>
                <div className="grid grid-cols-2 gap-2">
                    {(
                        [
                            'efectivo',
                            'tarjeta',
                            'transferencia',
                            'credito',
                        ] as const
                    ).map((m) => (
                        <MethodButton
                            key={m}
                            label={METHOD_LABELS[m]}
                            active={state.method === m}
                            onClick={() =>
                                onChange(
                                    m === 'credito' && !credit
                                        ? { method: m, amount: '0' }
                                        : { method: m },
                                )
                            }
                        />
                    ))}
                </div>
            </div>

            {credit && (
                <div className="state-espera flex flex-col gap-3 rounded-[12px] border border-espera-dot/30 bg-[var(--state-bg)] px-4 py-3">
                    <p className="flex items-start gap-2 text-[13px] text-espera-num">
                        <Info className="mt-[1px] h-4 w-4 shrink-0" />
                        <span>
                            El paciente abona lo que pueda hoy y el resto queda
                            en{' '}
                            <strong className="font-semibold">
                                Cuentas por cobrar
                            </strong>
                            .
                        </span>
                    </p>
                    {amount > 0 && (
                        <div className="flex flex-col gap-2">
                            <span className="text-[14px] font-medium text-text-heading">
                                Método del abono
                            </span>
                            <div className="grid grid-cols-3 gap-[6px]">
                                {(
                                    [
                                        'efectivo',
                                        'tarjeta',
                                        'transferencia',
                                    ] as const
                                ).map((m) => (
                                    <MethodButton
                                        key={m}
                                        label={METHOD_LABELS[m]}
                                        active={state.downMethod === m}
                                        onClick={() =>
                                            onChange({ downMethod: m })
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                    <FormField
                        name="due_date"
                        type="date"
                        label="Fecha compromiso de pago"
                        value={state.dueDate}
                        onChange={(e) => onChange({ dueDate: e.target.value })}
                        error={errors['credit.due_date']}
                        required
                    />
                    <FormField
                        name="credit_note"
                        label="Nota"
                        placeholder="Ej.: pagará el resto el viernes; garante: hijo"
                        value={state.note}
                        onChange={(e) => onChange({ note: e.target.value })}
                    />
                    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-espera-dot/30 pt-2 text-[13.5px] tabular-nums">
                        <span className="text-espera-num">Abono hoy</span>
                        <span className="text-right">
                            {formatMoney(Math.min(amount, balance))}
                        </span>
                        <span className="font-semibold text-espera-num">
                            Queda a crédito
                        </span>
                        <span className="text-right font-semibold">
                            {formatMoney(Math.max(0, balance - amount))}
                        </span>
                    </div>
                </div>
            )}

            {amount > 0 && method === 'efectivo' && (
                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        name="received"
                        label="Efectivo recibido (RD$)"
                        inputMode="decimal"
                        placeholder="Igual al monto"
                        value={state.received}
                        onChange={(e) => onChange({ received: e.target.value })}
                        error={
                            errors['payments.0.cash_received'] ??
                            (change !== null && change < 0
                                ? 'Es menor que el monto.'
                                : undefined)
                        }
                    />
                    <div className="flex flex-col gap-[6px]">
                        <span className="text-[14px] font-medium text-text-heading">
                            Cambio
                        </span>
                        <span className="flex h-9 items-center rounded-[10px] bg-muted-bg px-3 font-semibold tabular-nums">
                            {formatMoney(
                                change !== null && change > 0 ? change : 0,
                            )}
                        </span>
                    </div>
                </div>
            )}

            {amount > 0 && method === 'transferencia' && (
                <FormField
                    name="reference"
                    label="Número de la transferencia"
                    value={state.reference}
                    onChange={(e) => onChange({ reference: e.target.value })}
                    error={errors['payments.0.reference']}
                    required
                />
            )}

            {amount > 0 && method === 'tarjeta' && (
                <FormField
                    name="reference"
                    label="Número de aprobación (opcional)"
                    value={state.reference}
                    onChange={(e) => onChange({ reference: e.target.value })}
                />
            )}
        </div>
    );
}
