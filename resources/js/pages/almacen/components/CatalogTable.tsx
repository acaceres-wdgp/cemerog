import React from 'react';
import { Pencil, SlidersHorizontal } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { expiryLabel, KIND_LABELS } from '../types';
import type { InventoryItemRow } from '../types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';
const pill =
    'inline-flex rounded-full px-[10px] py-[3px] text-[12px] font-medium whitespace-nowrap';
const iconBtn =
    'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg';

/** Código · Artículo · Categoría · Existencia · Mínimo · Costo · Precio · Lote · vence · Alertas */
export default function CatalogTable({
    rows,
    canEdit,
    onEdit,
    onAdjust,
}: {
    rows: InventoryItemRow[];
    canEdit: boolean;
    onEdit: (item: InventoryItemRow) => void;
    onAdjust: (item: InventoryItemRow) => void;
}) {
    return (
        <table className="w-full min-w-[1000px] border-collapse text-[14px]">
            <thead>
                <tr>
                    <th className={`${th} pl-5 text-left`}>Código</th>
                    <th className={`${th} text-left`}>Artículo</th>
                    <th className={`${th} text-left`}>Categoría</th>
                    <th className={`${th} text-right`}>Existencia</th>
                    <th className={`${th} text-right`}>Mínimo</th>
                    <th className={`${th} text-right`}>Costo</th>
                    <th className={`${th} text-right`}>Precio</th>
                    <th className={`${th} text-left`}>Lote · vence</th>
                    <th className={`${th} text-left`}>Alertas</th>
                    <th className={`${th} pr-5`}>
                        <span className="sr-only">Acciones</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((i) => (
                    <tr key={i.id} className={cn(!i.is_active && 'text-muted')}>
                        <td className={`${td} pl-5 font-mono text-[12.5px]`}>
                            {i.code}
                        </td>
                        <td className={td}>
                            <div className="font-medium text-text-heading">
                                {i.name}
                            </div>
                            {i.presentation && (
                                <div className="text-[12.5px] text-text-tertiary">
                                    {i.presentation}
                                </div>
                            )}
                        </td>
                        <td className={td}>{KIND_LABELS[i.kind]}</td>
                        <td
                            className={cn(
                                td,
                                'text-right font-semibold tabular-nums',
                                i.low_stock && 'text-error',
                            )}
                        >
                            {i.stock}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>
                            {i.min_stock}
                        </td>
                        <td
                            className={`${td} text-right text-text-secondary tabular-nums`}
                            title={
                                i.suppliers.length > 1
                                    ? `Último costo · ${i.suppliers.length} proveedores`
                                    : undefined
                            }
                        >
                            {i.cost !== null ? formatMoney(i.cost) : '—'}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>
                            {formatMoney(i.price)}
                        </td>
                        <td className={`${td} text-[13px] text-text-secondary`}>
                            {i.lot || i.expires_on ? (
                                <>
                                    <span className="font-mono text-[12px]">
                                        {i.lot ?? '—'}
                                    </span>
                                    {' · '}
                                    {i.expires_on ?? '—'}
                                </>
                            ) : (
                                '—'
                            )}
                        </td>
                        <td className={td}>
                            <div className="flex flex-wrap gap-1">
                                {i.low_stock && (
                                    <span
                                        className={`${pill} state-espera bg-[var(--state-bg)] text-[var(--state-text)]`}
                                    >
                                        Bajo mínimo
                                    </span>
                                )}
                                {i.expires_soon && i.expires_on && (
                                    <span
                                        className={`${pill} state-pendiente bg-[var(--state-bg)] text-[var(--state-text)]`}
                                    >
                                        {expiryLabel(i.expires_on)}
                                    </span>
                                )}
                                {!i.is_active && (
                                    <span
                                        className={`${pill} bg-muted-bg text-text-secondary`}
                                    >
                                        Inactivo
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className={`${td} pr-5`}>
                            {canEdit && (
                                <div className="flex justify-end gap-1.5">
                                    <button
                                        type="button"
                                        aria-label={`Ajustar existencia de ${i.name}`}
                                        title="Ajustar existencia"
                                        onClick={() => onAdjust(i)}
                                        className={iconBtn}
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label={`Editar ${i.name}`}
                                        onClick={() => onEdit(i)}
                                        className={iconBtn}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
