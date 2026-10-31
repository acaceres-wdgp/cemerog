import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import FormField from '@/components/cemerog/FormField';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { parseMoney } from '@/lib/money';
import caja from '@/routes/caja';
import type { BillableAccount } from '../types';
import ChargesTable from './ChargesTable';

type DiscountType = 'porcentaje' | 'monto';

/** Discount in centavos for the typed value; null when the value is invalid */
export function computeDiscount(
    subtotal: number,
    type: DiscountType,
    value: string,
): number | null {
    if (value.trim() === '') return 0;
    if (type === 'porcentaje') {
        const pct = Number(value);
        if (!Number.isInteger(pct) || pct < 1 || pct > 100) return null;
        return Math.round((subtotal * pct) / 100);
    }
    const amount = parseMoney(value);
    if (amount < 1 || amount > subtotal) return null;
    return amount;
}

/** Preview of the invoice for an account, with the optional discount */
export default function InvoiceDraft({
    account,
}: {
    account: BillableAccount;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [withDiscount, setWithDiscount] = useState(false);
    const [type, setType] = useState<DiscountType>('porcentaje');
    const [value, setValue] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const inCare = account.status === 'abierta';
    const discount = withDiscount
        ? computeDiscount(account.total, type, value)
        : 0;
    const invalidDiscount =
        withDiscount &&
        (discount === null || discount === 0 || reason.trim() === '');

    const emit = () => {
        setIsLoading(true);
        const payload = withDiscount
            ? {
                  discount_type: type,
                  discount_value:
                      type === 'porcentaje' ? Number(value) : parseMoney(value),
                  discount_reason: reason.trim(),
              }
            : {};
        router.post(caja.invoices.store.url(account.id), payload, {
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-card-border bg-white px-5 py-4">
            <header>
                <h2 className="m-0 font-serif text-[18px] font-semibold text-text-heading">
                    {account.patient.full_name}
                </h2>
                <p className="text-[13px] text-muted">
                    Expediente {account.patient.expediente_number} · cuenta del{' '}
                    {account.service_date}
                </p>
            </header>

            <ChargesTable
                rows={account.charges}
                discount={discount ?? 0}
                discountLabel={
                    type === 'porcentaje' && value
                        ? `Descuento (${value}%)`
                        : 'Descuento'
                }
            />

            {inCare ? (
                <p className="rounded-xl border border-card-border bg-app-bg px-4 py-3 text-[13px] text-muted">
                    El paciente sigue en atención. La cuenta se podrá facturar
                    cuando el médico le dé el alta.
                </p>
            ) : (
                <>
                    <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-text-body">
                        <input
                            type="checkbox"
                            checked={withDiscount}
                            onChange={(e) => setWithDiscount(e.target.checked)}
                        />
                        Aplicar descuento
                    </label>

                    {withDiscount && (
                        <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-app-bg px-4 py-3">
                            <SegmentedControl<DiscountType>
                                segments={[
                                    {
                                        value: 'porcentaje',
                                        label: 'Porcentaje',
                                    },
                                    { value: 'monto', label: 'Monto' },
                                ]}
                                value={type}
                                onChange={(t) => {
                                    setType(t);
                                    setValue('');
                                }}
                                className="self-start"
                            />
                            <FormField
                                name="discount_value"
                                label={
                                    type === 'porcentaje'
                                        ? 'Porcentaje (1 a 100)'
                                        : 'Monto (RD$)'
                                }
                                inputMode="decimal"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                error={
                                    errors.discount_value ??
                                    (discount === null
                                        ? type === 'porcentaje'
                                            ? 'Escribe un porcentaje entero entre 1 y 100.'
                                            : 'El monto no puede ser mayor que el total.'
                                        : undefined)
                                }
                            />
                            <FormField
                                as="textarea"
                                name="discount_reason"
                                label="Motivo del descuento"
                                rows={2}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                error={errors.discount_reason}
                                required
                            />
                        </div>
                    )}

                    {errors.account && (
                        <p className="text-xs text-error" role="alert">
                            {errors.account}
                        </p>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={emit}
                            disabled={invalidDiscount || isLoading}
                            className="inline-flex h-9 items-center rounded-lg bg-primary px-[14px] text-sm font-medium text-white enabled:cursor-pointer enabled:hover:bg-primary-hover disabled:opacity-50"
                        >
                            Emitir factura
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}
