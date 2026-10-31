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

const methodsOf = (r: ReceiptRow) =>
    r.payments.map((p) => METHOD_LABELS[p.method]).join(' + ');

/** «Pagos» of an invoice as in the design, with print and (administrators) void */
export default function ReceiptsList({
    receipts,
    canVoid,
}: {
    receipts: ReceiptRow[];
    canVoid: boolean;
}) {
    const [voiding, setVoiding] = useState<ReceiptRow | null>(null);

    return (
        <div>
            <div className="mb-2 font-semibold text-text-heading">Pagos</div>
            {receipts.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-input-border px-3 py-[10px] text-[13px] text-muted">
                    Aún no hay pagos registrados.
                </div>
            ) : (
                receipts.map((r) => (
                    <div
                        key={r.id}
                        className={cn(
                            'flex items-start justify-between gap-3 border-b border-muted-bg py-2 text-[13px]',
                            r.voided && 'text-muted',
                        )}
                    >
                        <span className="min-w-0 flex-1">
                            {r.created_at.slice(0, 10)} · {methodsOf(r)} ·
                            Recibo {r.number}
                            {r.voided && (
                                <span className="block text-[12px]">
                                    Anulado: {r.void_reason}
                                </span>
                            )}
                            {!r.voided &&
                                r.payments.some(
                                    (p) => p.reference || p.change_given,
                                ) && (
                                    <span className="block text-[12px] text-muted">
                                        {r.payments
                                            .map(paymentLabel)
                                            .join(' + ')}
                                    </span>
                                )}
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                            <span
                                className={cn(
                                    'font-medium tabular-nums',
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
                                    Recibo
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
                    </div>
                ))
            )}
            {voiding && (
                <VoidReceiptDialog
                    receipt={voiding}
                    onClose={() => setVoiding(null)}
                />
            )}
        </div>
    );
}
