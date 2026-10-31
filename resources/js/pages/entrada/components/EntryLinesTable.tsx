import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatMoney, parseMoney } from '@/lib/money';
import type { CatalogOption, EntryLine } from '../types';
import { itemLabel } from '../types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-2 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider px-2 py-2 align-middle';
const input =
    'h-9 w-full rounded-lg border border-input-border bg-white px-2 tabular-nums outline-none focus:border-primary';
export const NEW_PRODUCT = '__new';

/** Producto · Existencia · Cantidad · Lote · Vence · Costo unit. · Subtotal */
export default function EntryLinesTable({
    lines,
    catalog,
    errors,
    onChange,
    onRemove,
    onNewProduct,
}: {
    lines: EntryLine[];
    catalog: CatalogOption[];
    errors: Record<string, string>;
    onChange: (key: number, patch: Partial<EntryLine>) => void;
    onRemove: (key: number) => void;
    onNewProduct: (key: number) => void;
}) {
    return (
        <table className="w-full min-w-[960px] border-collapse text-[14px]">
            <thead>
                <tr>
                    <th className={`${th} pl-5 text-left`}>Producto</th>
                    <th className={`${th} text-right`}>Existencia</th>
                    <th className={`${th} w-[100px] text-left`}>Cantidad</th>
                    <th className={`${th} w-[110px] text-left`}>Lote</th>
                    <th className={`${th} w-[150px] text-left`}>Vence</th>
                    <th className={`${th} w-[120px] text-left`}>Costo unit.</th>
                    <th className={`${th} text-right`}>Subtotal</th>
                    <th className={`${th} pr-5`}>
                        <span className="sr-only">Quitar</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {lines.map((l, index) => {
                    const item = catalog.find((c) => c.id === l.itemId);
                    const subtotal =
                        (parseInt(l.quantity, 10) || 0) * parseMoney(l.cost);
                    const err = (f: string) => errors[`lines.${index}.${f}`];
                    return (
                        <tr key={l.key}>
                            <td className={`${td} pl-5`}>
                                {l.newItem ? (
                                    <div>
                                        <div className="font-medium text-text-heading">
                                            {itemLabel(l.newItem)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[12px] text-muted">
                                            <span className="rounded-full bg-accent-bg px-2 py-0.5 font-semibold text-accent-fg">
                                                Nuevo
                                            </span>
                                            Se agrega al catálogo al guardar la
                                            entrada
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        aria-label={`Producto de la línea ${index + 1}`}
                                        value={l.itemId ?? ''}
                                        onChange={(e) => {
                                            if (
                                                e.target.value === NEW_PRODUCT
                                            ) {
                                                onNewProduct(l.key);
                                                return;
                                            }
                                            const id =
                                                Number(e.target.value) || null;
                                            const chosen = catalog.find(
                                                (c) => c.id === id,
                                            );
                                            onChange(l.key, {
                                                itemId: id,
                                                cost:
                                                    chosen?.cost != null
                                                        ? (
                                                              chosen.cost / 100
                                                          ).toFixed(2)
                                                        : l.cost,
                                            });
                                        }}
                                        className={`${input} min-w-[220px]`}
                                    >
                                        <option value="">
                                            Elegir producto…
                                        </option>
                                        {catalog.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.code} · {itemLabel(c)}
                                            </option>
                                        ))}
                                        <option value={NEW_PRODUCT}>
                                            + Crear producto nuevo…
                                        </option>
                                    </select>
                                )}
                                {err('inventory_item_id') && (
                                    <div className="text-xs text-error">
                                        {err('inventory_item_id')}
                                    </div>
                                )}
                            </td>
                            <td
                                className={`${td} text-right text-text-secondary tabular-nums`}
                            >
                                {item ? item.stock : l.newItem ? 0 : '—'}
                            </td>
                            <td className={td}>
                                <input
                                    aria-label={`Cantidad de la línea ${index + 1}`}
                                    inputMode="numeric"
                                    value={l.quantity}
                                    onChange={(e) =>
                                        onChange(l.key, {
                                            quantity: e.target.value.replace(
                                                /\D/g,
                                                '',
                                            ),
                                        })
                                    }
                                    className={input}
                                />
                                {err('quantity') && (
                                    <div className="text-xs text-error">
                                        {err('quantity')}
                                    </div>
                                )}
                            </td>
                            <td className={td}>
                                <input
                                    aria-label={`Lote de la línea ${index + 1}`}
                                    value={l.lot}
                                    onChange={(e) =>
                                        onChange(l.key, { lot: e.target.value })
                                    }
                                    className={`${input} min-w-[90px]`}
                                />
                            </td>
                            <td className={td}>
                                <input
                                    type="month"
                                    aria-label={`Vencimiento de la línea ${index + 1}`}
                                    value={l.expires}
                                    onChange={(e) =>
                                        onChange(l.key, {
                                            expires: e.target.value,
                                        })
                                    }
                                    className={`${input} min-w-[150px]`}
                                />
                                {err('expires_on') && (
                                    <div className="text-xs text-error">
                                        {err('expires_on')}
                                    </div>
                                )}
                            </td>
                            <td className={td}>
                                <input
                                    aria-label={`Costo unitario de la línea ${index + 1}`}
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={l.cost}
                                    onChange={(e) =>
                                        onChange(l.key, {
                                            cost: e.target.value,
                                        })
                                    }
                                    className={input}
                                />
                                {err('unit_cost') && (
                                    <div className="text-xs text-error">
                                        {err('unit_cost')}
                                    </div>
                                )}
                            </td>
                            <td
                                className={`${td} text-right font-semibold tabular-nums`}
                            >
                                {formatMoney(subtotal)}
                            </td>
                            <td className={`${td} pr-5 text-right`}>
                                <button
                                    type="button"
                                    aria-label={`Quitar línea ${index + 1}`}
                                    title="Quitar"
                                    onClick={() => onRemove(l.key)}
                                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error-bg hover:text-error"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
