import React from 'react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { cardCls, cardHeadCls, cardTitleCls } from './cuadreMath';

/** Count of the drawer by denomination, as in the design */
export default function CashCountCard({
    denominations,
    units,
    readOnly,
    onChange,
}: {
    denominations: number[];
    units: Record<number, string>;
    readOnly: boolean;
    onChange: (value: number, units: string) => void;
}) {
    const total = denominations.reduce(
        (sum, d) => sum + d * 100 * (parseInt(units[d] ?? '', 10) || 0),
        0,
    );

    return (
        <section className={cn(cardCls, 'overflow-hidden')}>
            <div className={cardHeadCls}>
                <h2 className={cardTitleCls}>Conteo de efectivo</h2>
            </div>
            <div className="px-5 py-2">
                {denominations.map((d) => {
                    const n = parseInt(units[d] ?? '', 10) || 0;
                    const label = `RD$${d.toLocaleString('en-US')}`;
                    return (
                        <div
                            key={d}
                            className="grid grid-cols-[90px_80px_1fr] items-center gap-[10px] py-1"
                        >
                            <span className="font-medium tabular-nums">
                                {label}
                            </span>
                            <input
                                aria-label={`Cantidad de ${label}`}
                                inputMode="numeric"
                                placeholder="0"
                                value={units[d] ?? ''}
                                readOnly={readOnly}
                                onChange={(e) =>
                                    onChange(
                                        d,
                                        e.target.value.replace(/\D/g, ''),
                                    )
                                }
                                className={cn(
                                    'h-[30px] w-full rounded-lg border border-input-border px-2 text-right tabular-nums outline-none focus:border-primary focus:ring-3 focus:ring-primary/15',
                                    readOnly ? 'bg-list-row-bg' : 'bg-white',
                                )}
                            />
                            <span className="text-right text-text-secondary tabular-nums">
                                {formatMoney(d * 100 * n)}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-between border-t border-divider bg-list-row-bg px-5 py-3 font-bold tabular-nums">
                <span>Efectivo contado</span>
                <span>{formatMoney(total)}</span>
            </div>
        </section>
    );
}
