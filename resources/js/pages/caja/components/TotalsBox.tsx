import React from 'react';
import { formatMoney } from '@/lib/money';

/** Subtotal · Descuento · Total · Pagado · Balance pendiente, as in the design */
export default function TotalsBox({
    subtotal,
    discount,
    discountLabel = 'Descuento',
    paid,
}: {
    subtotal: number;
    discount: number;
    discountLabel?: string;
    paid: number;
}) {
    const total = subtotal - discount;

    return (
        <div className="flex flex-col gap-2 tabular-nums">
            <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted">{discountLabel}</span>
                <span className={discount > 0 ? 'text-error' : undefined}>
                    {discount > 0
                        ? `−${formatMoney(discount)}`
                        : formatMoney(0)}
                </span>
            </div>
            <div className="flex justify-between border-t border-divider pt-2 text-[16px] font-semibold text-text-heading">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted">Pagado</span>
                <span>{formatMoney(paid)}</span>
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-accent-bg px-3 py-[10px] font-semibold text-accent-fg">
                <span>Balance pendiente</span>
                <span className="text-[18px]">
                    {formatMoney(Math.max(0, total - paid))}
                </span>
            </div>
        </div>
    );
}
