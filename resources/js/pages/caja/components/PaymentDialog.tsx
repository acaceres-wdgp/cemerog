import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import { formatMoney } from '@/lib/money';
import caja from '@/routes/caja';
import type { InvoiceDetail } from '../types';
import PaymentFields, {
    initialPayment,
    paymentIsValid,
    paymentPayload,
} from './PaymentFields';
import type { PaymentState } from './PaymentFields';

/** «Registrar pago» on an issued invoice (also the installments of a credit) */
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
    // An installment keeps the due date the credit already has
    const [payment, setPayment] = useState<PaymentState>(() =>
        initialPayment(
            invoice.balance,
            invoice.credit_due_date
                ? invoice.credit_due_date.split('/').reverse().join('-')
                : '',
        ),
    );
    const [isLoading, setIsLoading] = useState(false);
    const canSubmit = paymentIsValid(payment, invoice.balance);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        router.post(
            caja.payments.store.url(invoice.id),
            paymentPayload(payment),
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Registrar pago"
            description={`${invoice.number} · Balance pendiente: ${formatMoney(invoice.balance)}`}
            submitLabel={
                payment.method === 'credito'
                    ? 'Registrar crédito'
                    : 'Registrar pago'
            }
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!canSubmit}
        >
            <div className="flex flex-col gap-4">
                {(errors.shift || errors.invoice) && (
                    <p className="text-xs text-error" role="alert">
                        {errors.shift ?? errors.invoice}
                    </p>
                )}
                <PaymentFields
                    state={payment}
                    balance={invoice.balance}
                    errors={errors}
                    onChange={(patch) =>
                        setPayment((p) => ({ ...p, ...patch }))
                    }
                />
            </div>
        </FormDialog>
    );
}
