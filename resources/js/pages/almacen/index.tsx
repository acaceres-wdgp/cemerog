import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { PackagePlus, Pencil, Plus, Search } from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { entrada } from '@/routes';
import ItemDialog from './components/ItemDialog';
import { KIND_LABELS } from './types';
import type { InventoryItemRow, ItemKind } from './types';

type Tab = 'todos' | ItemKind;

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';
const pill =
    'inline-flex rounded-full px-[10px] py-[3px] text-[12px] font-medium whitespace-nowrap';

export default function AlmacenIndex({
    items = [],
    can_edit = false,
}: {
    items?: InventoryItemRow[];
    can_edit?: boolean;
}) {
    const [tab, setTab] = useState<Tab>('todos');
    const [query, setQuery] = useState('');
    const [editing, setEditing] = useState<InventoryItemRow | 'new' | null>(
        null,
    );

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items
            .filter((i) => tab === 'todos' || i.kind === tab)
            .filter(
                (i) =>
                    q === '' ||
                    `${i.code} ${i.name} ${i.presentation ?? ''}`
                        .toLowerCase()
                        .includes(q),
            );
    }, [items, tab, query]);
    const count = (k: ItemKind) => items.filter((i) => i.kind === k).length;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-text-secondary">
                    Medicamentos e insumos. Cada aplicación a un paciente
                    descuenta existencia y genera un cargo.
                </p>
                <div className="flex gap-2">
                    <Link
                        href={entrada.url()}
                        className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg"
                    >
                        <PackagePlus className="h-4 w-4" />
                        Registrar entrada
                    </Link>
                    {can_edit && (
                        <button
                            type="button"
                            onClick={() => setEditing('new')}
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo artículo
                        </button>
                    )}
                </div>
            </div>
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white shadow-[0_1px_2px_rgba(16,40,24,.03)]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <SegmentedControl<Tab>
                        segments={[
                            {
                                value: 'todos',
                                label: 'Todos',
                                count: items.length,
                            },
                            {
                                value: 'medicamento',
                                label: 'Medicamentos',
                                count: count('medicamento'),
                            },
                            {
                                value: 'insumo',
                                label: 'Insumos',
                                count: count('insumo'),
                            },
                        ]}
                        value={tab}
                        onChange={setTab}
                    />
                    <label className="flex h-10 w-full max-w-[340px] items-center gap-2 rounded-[10px] border border-input-border bg-white px-3 focus-within:border-primary">
                        <Search className="h-4 w-4 text-muted" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre o código"
                            aria-label="Buscar por nombre o código"
                            className="w-full border-0 bg-transparent outline-none"
                        />
                    </label>
                </div>
                <table className="w-full min-w-[820px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Código</th>
                            <th className={`${th} text-left`}>Artículo</th>
                            <th className={`${th} text-left`}>Tipo</th>
                            <th className={`${th} text-right`}>Existencia</th>
                            <th className={`${th} text-right`}>Mínimo</th>
                            <th className={`${th} text-right`}>Precio</th>
                            <th className={`${th} text-left`}>Alertas</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((i) => (
                            <tr
                                key={i.id}
                                className={cn(!i.is_active && 'text-muted')}
                            >
                                <td
                                    className={`${td} pl-5 font-mono text-[12.5px]`}
                                >
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
                                <td className={`${td} text-right tabular-nums`}>
                                    {formatMoney(i.price)}
                                </td>
                                <td className={td}>
                                    <div className="flex flex-wrap gap-1">
                                        {i.low_stock && (
                                            <span
                                                className={`${pill} state-emergencia bg-[var(--state-bg)] text-[var(--state-text)]`}
                                            >
                                                Existencia baja
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
                                <td className={`${td} pr-5 text-right`}>
                                    {can_edit && (
                                        <button
                                            type="button"
                                            aria-label={`Editar ${i.name}`}
                                            onClick={() => setEditing(i)}
                                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        {items.length === 0
                            ? 'El catálogo está vacío. Agrega el primer artículo.'
                            : 'Ningún artículo coincide con el filtro.'}
                    </div>
                )}
            </section>
            {editing && (
                <ItemDialog
                    item={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
