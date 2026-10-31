import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import caja from '@/routes/caja';
import { METHOD_LABELS } from '../types';
import type { PaymentRow, ReceiptRow } from '../types';

export function paymentLabel(p: PaymentRow): string {
    const base = `${METHOD_LABELS[p.method]} ${formatMoney(p.amount)}`;
    if (p.method === 'efectivo' && p.change_given) {
        return `${base} (recibido ${formatMoney(p.cash_received ?? 0)}, devuelta ${formatMoney(p.change_given)})`;
    }
    return p.reference ? `${base} · #${p.reference}` : base;
}

function VoidReceiptDialog({
    receipt,
    onClose,
}: {
    receipt: ReceiptRow;
    onClose: () => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            caja.receipts.void.url(receipt.id),
            { void_reason: reason },
            {
                preserveScroll: true,
                onSuccess: onClose,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open
            onOpenChange={(open) => !open && onClose()}
            title={`Anular recibo ${receipt.number}`}
            description="Se devuelve el dinero y la factura vuelve a deber ese monto. Solo para recibos del turno abierto."
            submitLabel="Anular recibo"
            onSubmit={submit}
            isLoading={isLoading}
        >
            <div className="flex flex-col gap-2">
                {errors.receipt && (
                    <p className="text-xs text-error" role="alert">
                        {errors.receipt}
                    </p>
                )}
                <FormField
                    as="textarea"
                    name="void_reason"
                    label="Motivo"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    error={errors.void_reason}
                    required
                />
            </div>
        </FormDialog>
    );
}

/** Receipts of an invoice, with print and (administrators) void */
export default function ReceiptsList({
    receipts,
    canVoid,
}: {
    receipts: ReceiptRow[];
    canVoid: boolean;
}) {
    const [voiding, setVoiding] = useState<ReceiptRow | null>(null);

    if (receipts.length === 0) return null;

    return (
        <div>
            <p className="mb-1 text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase">
                Recibos
            </p>
            <ul className="m-0 list-none divide-y divide-divider rounded-xl border border-card-border p-0 text-[13px]">
                {receipts.map((r) => (
                    <li
                        key={r.id}
                        className={cn(
                            'flex flex-wrap items-center justify-between gap-2 px-4 py-2',
                            r.voided && 'text-muted',
                        )}
                    >
                        <span>
                            <span className="font-semibold text-text-heading">
                                {r.number}
                            </span>{' '}
                            · {r.created_at} · {r.created_by}
                            <span className="block text-[12px] text-muted">
                                {r.voided
                                    ? `Anulado: ${r.void_reason}`
                                    : r.payments.map(paymentLabel).join(' + ')}
                            </span>
                        </span>
                        <span className="flex items-center gap-3">
                            <span
                                className={cn(
                                    'font-semibold tabular-nums',
                                    r.voided && 'line-through',
                                )}
                            >
                                {formatMoney(r.total)}
                            </span>
                            {!r.voided && (
                                <a
                                    href={caja.receipts.print.url(r.id)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[12.5px] font-semibold text-primary"
                                >
                                    Imprimir
                                </a>
                            )}
                            {canVoid && !r.voided && (
                                <button
                                    type="button"
                                    onClick={() => setVoiding(r)}
                                    className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-error"
                                >
                                    Anular
                                </button>
                            )}
                        </span>
                    </li>
                ))}
            </ul>
            {voiding && (
                <VoidReceiptDialog
                    receipt={voiding}
                    onClose={() => setVoiding(null)}
                />
            )}
        </div>
    );
}
