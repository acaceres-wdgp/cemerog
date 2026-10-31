import React from 'react';
import { formatMoney } from '@/lib/money';
import type { ChargeRow } from '../types';

const thCls =
    'px-4 py-2 text-left text-[11.5px] font-semibold tracking-[.05em] text-table-header-text uppercase';

/** Charges of an account or lines of an invoice, with subtotal, discount and total */
export default function ChargesTable({
    rows,
    discount = 0,
    discountLabel,
}: {
    rows: ChargeRow[];
    discount?: number;
    discountLabel?: string;
}) {
    const subtotal = rows.reduce((sum, r) => sum + r.total, 0);

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-[13px]">
                <thead className="bg-app-bg">
                    <tr>
                        <th className={thCls}>Descripción</th>
                        <th className={`${thCls} text-right`}>Cant.</th>
                        <th className={`${thCls} text-right`}>Precio</th>
                        <th className={`${thCls} text-right`}>Importe</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.id} className="border-t border-divider">
                            <td className="px-4 py-2 text-text-body">
                                {r.description}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">
                                {r.quantity}
                            </td>
                            <td className="px-4 py-2 text-right tabular-nums">
                                {formatMoney(r.unit_price)}
                            </td>
                            <td className="px-4 py-2 text-right font-medium tabular-nums">
                                {formatMoney(r.total)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="text-[13.5px]">
                    <tr className="border-t border-divider">
                        <td
                            colSpan={3}
                            className="px-4 py-2 text-right text-muted"
                        >
                            Subtotal
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                            {formatMoney(subtotal)}
                        </td>
                    </tr>
                    {discount > 0 && (
                        <tr>
                            <td
                                colSpan={3}
                                className="px-4 py-1 text-right text-muted"
                            >
                                {discountLabel ?? 'Descuento'}
                            </td>
                            <td className="px-4 py-1 text-right text-error tabular-nums">
                                −{formatMoney(discount)}
                            </td>
                        </tr>
                    )}
                    <tr>
                        <td
                            colSpan={3}
                            className="px-4 py-2 text-right font-semibold text-text-heading"
                        >
                            Total
                        </td>
                        <td className="px-4 py-2 text-right font-serif text-[17px] font-semibold text-text-heading tabular-nums">
                            {formatMoney(subtotal - discount)}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
