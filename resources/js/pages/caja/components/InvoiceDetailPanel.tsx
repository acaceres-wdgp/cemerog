import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { formatMoney } from '@/lib/money';
import caja from '@/routes/caja';
import { INVOICE_STATUS_LABELS } from '../types';
import type { InvoiceDetail, InvoiceStatus } from '../types';
import ChargesTable from './ChargesTable';
import CollectButton from './CollectButton';
import ReceiptsList from './ReceiptsList';

type BadgeState = React.ComponentProps<typeof StatusBadge>['state'];

const STATUS_BADGE: Record<InvoiceStatus, BadgeState> = {
    pendiente: 'balance',
    pagada: 'saldada',
    anulada: 'cancelada',
};

function VoidDialog({
    invoice,
    open,
    onOpenChange,
}: {
    invoice: InvoiceDetail;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            caja.invoices.void.url(invoice.id),
            { void_reason: reason },
            { onFinish: () => setIsLoading(false) },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={`Anular factura ${invoice.number}`}
            description="La factura deja de contar y la cuenta vuelve a quedar pendiente de facturar."
            submitLabel="Anular factura"
            onSubmit={submit}
            isLoading={isLoading}
        >
            <div className="flex flex-col gap-2">
                {errors.invoice && (
                    <p className="text-xs text-error" role="alert">
                        {errors.invoice}
                    </p>
                )}
                <FormField
                    as="textarea"
                    name="void_reason"
                    label="Motivo de la anulación"
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

/** An issued invoice: lines, totals, print and (administrators) void */
export default function InvoiceDetailPanel({
    invoice,
    canVoid,
}: {
    invoice: InvoiceDetail;
    canVoid: boolean;
}) {
    const [voiding, setVoiding] = useState(false);
    const discountLabel =
        invoice.discount_type === 'porcentaje'
            ? `Descuento (${invoice.discount_value}%)`
            : 'Descuento';

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-card-border bg-white px-5 py-4">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="m-0 font-serif text-[18px] font-semibold text-text-heading">
                            Factura {invoice.number}
                        </h2>
                        <StatusBadge
                            state={STATUS_BADGE[invoice.status]}
                            label={INVOICE_STATUS_LABELS[invoice.status]}
                        />
                    </div>
                    <p className="text-[13px] text-muted">
                        {invoice.patient.full_name} · emitida{' '}
                        {invoice.issued_at} por {invoice.issued_by}
                    </p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={caja.invoices.print.url(invoice.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-card-border bg-white px-3 text-sm font-medium text-text-body hover:bg-app-bg"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </a>
                    {canVoid && invoice.status !== 'anulada' && (
                        <button
                            type="button"
                            onClick={() => setVoiding(true)}
                            className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-error-border bg-error-bg px-3 text-sm font-medium text-error"
                        >
                            Anular
                        </button>
                    )}
                </div>
            </header>

            {invoice.status === 'anulada' && (
                <p className="rounded-xl border border-card-border bg-muted-bg px-4 py-3 text-[13px] text-muted">
                    Anulada por {invoice.voided_by} el {invoice.voided_at}:{' '}
                    {invoice.void_reason}
                </p>
            )}

            <ChargesTable
                rows={invoice.lines}
                discount={invoice.discount_amount}
                discountLabel={discountLabel}
            />
            {invoice.discount_reason && (
                <p className="text-[12.5px] text-muted">
                    Motivo del descuento: {invoice.discount_reason}
                </p>
            )}

            <ReceiptsList receipts={invoice.receipts} canVoid={canVoid} />

            {invoice.credit_due_date && invoice.status === 'pendiente' && (
                <p className="text-[12.5px] text-muted">
                    Crédito: fecha compromiso {invoice.credit_due_date}
                    {invoice.credit_note ? ` · ${invoice.credit_note}` : ''}
                </p>
            )}

            {invoice.status !== 'anulada' && (
                <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-[13.5px]">
                    <span className="text-muted">
                        Pagado{' '}
                        <span className="font-semibold text-text-heading tabular-nums">
                            {formatMoney(invoice.paid_amount)}
                        </span>
                    </span>
                    <span className="text-muted">
                        Balance{' '}
                        <span className="font-semibold text-error tabular-nums">
                            {formatMoney(invoice.balance)}
                        </span>
                    </span>
                    {invoice.status === 'pendiente' && (
                        <CollectButton invoice={invoice} />
                    )}
                </div>
            )}

            {canVoid && (
                <VoidDialog
                    invoice={invoice}
                    open={voiding}
                    onOpenChange={setVoiding}
                />
            )}
        </section>
    );
}
