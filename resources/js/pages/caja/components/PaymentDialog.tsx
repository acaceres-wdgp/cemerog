import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { formatMoney, parseMoney } from '@/lib/money';
import caja from '@/routes/caja';
import type { InvoiceDetail, PaymentMethod } from '../types';
import PaymentLineFields from './PaymentLineFields';
import type { Line } from './PaymentLineFields';

const pesos = (centavos: number) => (centavos / 100).toFixed(2);

const newLine = (method: PaymentMethod, amount = ''): Line => ({
    method,
    amount,
    received: '',
    reference: '',
});

/**
 * Collect an invoice: one or more methods (cash with change, card, transfer
 * with its number). Whatever is left goes to credit with a due date.
 */
export default function PaymentDialog({
    invoice,
    open,
    onOpenChange,
}: {
    invoice: InvoiceDetail;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [lines, setLines] = useState<Line[]>([
        newLine('efectivo', pesos(invoice.balance)),
    ]);
    // A later installment keeps the due date the credit already has
    const [dueDate, setDueDate] = useState(() =>
        invoice.credit_due_date
            ? invoice.credit_due_date.split('/').reverse().join('-')
            : '',
    );
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const paying = lines.reduce((sum, l) => sum + parseMoney(l.amount), 0);
    const leftover = invoice.balance - paying;
    const overpaid = leftover < 0;
    const needsCredit = leftover > 0;
    const missingTransfer = lines.some(
        (l) =>
            l.method === 'transferencia' &&
            parseMoney(l.amount) > 0 &&
            l.reference.trim() === '',
    );
    const shortCash = lines.some(
        (l) =>
            l.method === 'efectivo' &&
            l.received.trim() !== '' &&
            parseMoney(l.received) < parseMoney(l.amount),
    );
    const canSubmit =
        !overpaid &&
        !missingTransfer &&
        !shortCash &&
        (paying > 0 || needsCredit) &&
        (!needsCredit || dueDate !== '');

    const update = (i: number, patch: Partial<Line>) =>
        setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        router.post(
            caja.payments.store.url(invoice.id),
            {
                payments: lines
                    .filter((l) => parseMoney(l.amount) > 0)
                    .map((l) => ({
                        method: l.method,
                        amount: parseMoney(l.amount),
                        ...(l.method === 'efectivo' && l.received.trim() !== ''
                            ? { cash_received: parseMoney(l.received) }
                            : {}),
                        ...(l.method !== 'efectivo' && l.reference.trim() !== ''
                            ? { reference: l.reference.trim() }
                            : {}),
                    })),
                ...(needsCredit
                    ? {
                          credit: {
                              due_date: dueDate,
                              note: note.trim() || null,
                          },
                      }
                    : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const usedMethods = lines.map((l) => l.method);
    const nextMethod = (['efectivo', 'tarjeta', 'transferencia'] as const).find(
        (m) => !usedMethods.includes(m),
    );

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Registrar pago · ${invoice.number}`}
            description={`Balance pendiente: ${formatMoney(invoice.balance)}`}
            submitLabel="Registrar pago"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!canSubmit}
            maxWidth="sm:max-w-xl"
        >
            <div className="flex flex-col gap-4">
                {(errors.shift || errors.payments || errors.invoice) && (
                    <p className="text-xs text-error" role="alert">
                        {errors.shift ?? errors.payments ?? errors.invoice}
                    </p>
                )}

                {lines.map((line, i) => (
                    <PaymentLineFields
                        key={i}
                        index={i}
                        line={line}
                        removable={lines.length > 1}
                        errors={errors}
                        onChange={(patch) => update(i, patch)}
                        onRemove={() =>
                            setLines((ls) => ls.filter((_, j) => j !== i))
                        }
                    />
                ))}

                {nextMethod && (
                    <button
                        type="button"
                        onClick={() =>
                            setLines((ls) => [
                                ...ls,
                                newLine(
                                    nextMethod,
                                    leftover > 0 ? pesos(leftover) : '',
                                ),
                            ])
                        }
                        className="self-start border-0 bg-transparent p-0 text-[13px] font-semibold text-primary"
                    >
                        + Agregar otro método
                    </button>
                )}

                <div className="flex flex-wrap justify-between gap-2 border-t border-divider pt-3 text-[13.5px]">
                    <span className="text-muted">
                        Pagando{' '}
                        <span className="font-semibold text-text-heading tabular-nums">
                            {formatMoney(paying)}
                        </span>
                    </span>
                    {overpaid ? (
                        <span className="font-semibold text-error">
                            Pasa del balance por {formatMoney(-leftover)}
                        </span>
                    ) : (
                        <span className="text-muted">
                            Queda{' '}
                            <span className="font-semibold text-text-heading tabular-nums">
                                {formatMoney(leftover)}
                            </span>
                        </span>
                    )}
                </div>

                {needsCredit && (
                    <div className="flex flex-col gap-2 rounded-xl border border-card-border bg-white px-4 py-3">
                        <p className="text-[13px] text-text-body">
                            Crédito: {formatMoney(leftover)} quedan en cuentas
                            por cobrar.
                        </p>
                        <FormField
                            name="due_date"
                            type="date"
                            label="Fecha compromiso de pago"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            error={errors['credit.due_date']}
                            required
                        />
                        <FormField
                            as="textarea"
                            name="credit_note"
                            label="Nota (opcional)"
                            rows={2}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                )}
            </div>
        </FormDialog>
    );
}
