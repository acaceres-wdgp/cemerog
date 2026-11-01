import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { cancel } from '@/routes/lab/orders';
import type { LabOrderSummary } from './types';

/**
 * Cancel an order not started (e.g. the patient does it elsewhere). For
 * imaging pass its `url` and `description`.
 */
export default function CancelLabOrderDialog({
    order,
    onClose,
    url,
    description,
}: {
    order: Pick<LabOrderSummary, 'id' | 'number'> & { tests?: string[] };
    onClose: () => void;
    url?: string;
    description?: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            url ?? cancel.url(order.id),
            { reason: reason.trim() },
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
            title={`Cancelar orden ${order.number}`}
            description={`${description ?? (order.tests ?? []).join(' · ')}. No se cobra.`}
            submitLabel="Cancelar orden"
            cancelLabel="Volver"
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={reason.trim() === ''}
        >
            <div className="flex flex-col gap-2">
                {errors.order && (
                    <p className="m-0 text-xs text-error">{errors.order}</p>
                )}
                <FormField
                    name="reason"
                    label="Motivo"
                    placeholder="Ej.: se lo hará en otro laboratorio"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    error={errors.reason}
                    required
                />
            </div>
        </FormDialog>
    );
}
