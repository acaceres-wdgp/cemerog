import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import caja from '@/routes/caja';
import type { InvoiceDetail } from '../types';

export default function VoidInvoiceDialog({
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
            description="La factura deja de contar y la atención vuelve a Pendiente de facturar."
            submitLabel="Anular factura"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={reason.trim() === ''}
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
