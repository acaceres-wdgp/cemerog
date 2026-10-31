import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormDialog from '@/components/cemerog/FormDialog';
import FormField from '@/components/cemerog/FormField';
import { formatMoney, parseMoney } from '@/lib/money';
import caja from '@/routes/caja';
import type { Withdrawal } from '../types';

function WithdrawalDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        router.post(
            caja.turno.withdraw.url(),
            { amount: parseMoney(amount), reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAmount('');
                    setReason('');
                    onOpenChange(false);
                },
                onFinish: () => setIsLoading(false),
            },
        );
    };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Registrar retiro"
            description="Efectivo que sale de la caja (depósito al banco, gasto menor)."
            submitLabel="Registrar retiro"
            onSubmit={submit}
            isLoading={isLoading}
        >
            <div className="flex flex-col gap-3">
                <FormField
                    name="amount"
                    label="Monto (RD$)"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    error={errors.amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                <FormField
                    name="reason"
                    label="Motivo"
                    placeholder="Ej: Depósito al banco"
                    value={reason}
                    error={errors.reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                />
            </div>
        </FormDialog>
    );
}

export default function WithdrawalsPanel({
    withdrawals,
    canOperate,
}: {
    withdrawals: Withdrawal[];
    canOperate: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <section className="rounded-2xl border border-card-border bg-white">
            <div className="flex items-center justify-between border-b border-divider px-5 py-3">
                <h2 className="m-0 font-serif text-[16px] font-semibold text-text-heading">
                    Retiros del turno
                </h2>
                {canOperate && (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-card-border bg-white px-3 text-[13px] font-medium text-text-body hover:bg-app-bg"
                    >
                        Registrar retiro
                    </button>
                )}
            </div>
            {withdrawals.length === 0 ? (
                <p className="px-5 py-6 text-center text-[13px] text-muted">
                    Sin retiros en este turno.
                </p>
            ) : (
                <ul className="m-0 list-none p-0 text-[13px]">
                    {withdrawals.map((w) => (
                        <li
                            key={w.id}
                            className="flex items-center justify-between gap-3 border-b border-divider px-5 py-3 last:border-b-0"
                        >
                            <span className="text-text-body">
                                <span className="text-muted tabular-nums">
                                    {w.time}
                                </span>{' '}
                                · {w.reason}{' '}
                                <span className="text-muted">
                                    ({w.created_by})
                                </span>
                            </span>
                            <span className="font-semibold text-text-heading tabular-nums">
                                {formatMoney(w.amount)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
            {canOperate && (
                <WithdrawalDialog open={open} onOpenChange={setOpen} />
            )}
        </section>
    );
}
