import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { paymentLabel } from '@/pages/caja/components/ReceiptsList';
import type { ShiftReceipt } from '../types';

/** Receipts collected in the shift */
export default function ShiftReceipts({
    receipts,
}: {
    receipts: ShiftReceipt[];
}) {
    return (
        <section className="rounded-2xl border border-card-border bg-white">
            <h2 className="m-0 border-b border-divider px-5 py-3 font-serif text-[16px] font-semibold text-text-heading">
                Cobros del turno
            </h2>
            {receipts.length === 0 ? (
                <p className="px-5 py-6 text-center text-[13px] text-muted">
                    Sin cobros en este turno.
                </p>
            ) : (
                <ul className="m-0 list-none p-0 text-[13px]">
                    {receipts.map((r) => (
                        <li
                            key={r.id}
                            className={cn(
                                'flex items-start justify-between gap-3 border-b border-divider px-5 py-3 last:border-b-0',
                                r.voided && 'text-muted',
                            )}
                        >
                            <span>
                                <span className="font-semibold text-text-heading">
                                    {r.number}
                                </span>{' '}
                                · {r.invoice_number} · {r.patient}
                                <span className="block text-[12px] text-muted">
                                    {r.voided
                                        ? `Anulado: ${r.void_reason}`
                                        : r.payments
                                              .map(paymentLabel)
                                              .join(' + ')}
                                </span>
                            </span>
                            <span
                                className={cn(
                                    'shrink-0 font-semibold tabular-nums',
                                    r.voided && 'line-through',
                                )}
                            >
                                {formatMoney(r.total)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
