import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import { formatMoney } from '@/lib/money';
import caja from '@/routes/caja';
import type { BillableAccount } from '../types';
import DiscountFields, {
    discountAmount,
    discountIsValid,
    discountPayload,
    initialDiscount,
} from './DiscountFields';
import type { DiscountState } from './DiscountFields';
import PaymentFields, {
    initialPayment,
    paymentIsValid,
    paymentPayload,
} from './PaymentFields';
import type { PaymentState } from './PaymentFields';

/**
 * Emit the invoice of an account and, in the same step, collect it or
 * leave it on credit. An optional discount lowers the total first.
 */
export default function EmitInvoiceDialog({
    account,
    open,
    onOpenChange,
}: {
    account: BillableAccount;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [discount, setDiscount] = useState<DiscountState>(initialDiscount);
    const [payment, setPayment] = useState<PaymentState>(() =>
        initialPayment(account.total),
    );
    const [isLoading, setIsLoading] = useState(false);

    const total =
        account.total - (discountAmount(discount, account.total) ?? 0);
    const free = total === 0;
    const canSubmit =
        discountIsValid(discount, account.total) &&
        (free || paymentIsValid(payment, total));

    const changeDiscount = (patch: Partial<DiscountState>) => {
        const next = { ...discount, ...patch };
        setDiscount(next);
        // Keep the amount to collect in step with the discounted total
        if (payment.method !== 'credito') {
            const nextTotal =
                account.total - (discountAmount(next, account.total) ?? 0);
            setPayment((p) => ({ ...p, amount: (nextTotal / 100).toFixed(2) }));
        }
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!canSubmit) return;
        setIsLoading(true);
        router.post(
            caja.invoices.store.url(account.id),
            {
                ...discountPayload(discount),
                ...(free ? {} : paymentPayload(payment)),
            },
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
            title="Emitir factura"
            description={`${account.patient.full_name} · Total a facturar: ${formatMoney(total)}`}
            submitLabel={
                free
                    ? 'Emitir factura'
                    : payment.method === 'credito'
                      ? 'Emitir a crédito'
                      : 'Emitir y cobrar'
            }
            onSubmit={submit}
            isLoading={isLoading}
            submitDisabled={!canSubmit}
            maxWidth="sm:max-w-xl"
        >
            <div className="flex flex-col gap-5">
                {(errors.account || errors.shift || errors.invoice) && (
                    <p className="text-xs text-error" role="alert">
                        {errors.account ?? errors.shift ?? errors.invoice}
                    </p>
                )}
                <DiscountFields
                    state={discount}
                    subtotal={account.total}
                    errors={errors}
                    onChange={changeDiscount}
                />
                {free ? (
                    <p className="rounded-[10px] bg-accent-bg px-3 py-2 text-[13px] text-accent-fg">
                        Con el descuento completo no hay nada que cobrar.
                    </p>
                ) : (
                    <PaymentFields
                        state={payment}
                        balance={total}
                        errors={errors}
                        onChange={(patch) =>
                            setPayment((p) => ({ ...p, ...patch }))
                        }
                    />
                )}
            </div>
        </FormDialog>
    );
}
