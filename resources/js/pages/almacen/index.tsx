import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { PackagePlus, Plus, Search, Truck } from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { entrada } from '@/routes';
import { suppliers as suppliersRoute } from '@/routes/almacen';
import AdjustDialog from './components/AdjustDialog';
import CatalogStats from './components/CatalogStats';
import type { AlertFilter } from './components/CatalogStats';
import CatalogTable from './components/CatalogTable';
import ItemDialog from './components/ItemDialog';
import type { InventoryItemRow, ItemKind } from './types';

type Tab = 'todos' | ItemKind;

const secondary =
    'inline-flex h-9 items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg';

export default function AlmacenIndex({
    items = [],
    can_edit = false,
    adjustment_reasons = {},
}: {
    items?: InventoryItemRow[];
    can_edit?: boolean;
    adjustment_reasons?: Record<string, string>;
}) {
    const [tab, setTab] = useState<Tab>('todos');
    const [alert, setAlert] = useState<AlertFilter>('todas');
    const [query, setQuery] = useState('');
    const [editing, setEditing] = useState<InventoryItemRow | 'new' | null>(
        null,
    );
    const [adjusting, setAdjusting] = useState<InventoryItemRow | null>(null);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items
            .filter((i) => tab === 'todos' || i.kind === tab)
            .filter(
                (i) =>
                    alert === 'todas' ||
                    (alert === 'bajo' && i.is_active && i.low_stock) ||
                    (alert === 'vence' && i.is_active && i.expires_soon),
            )
            .filter(
                (i) =>
                    q === '' ||
                    `${i.code} ${i.name} ${i.presentation ?? ''}`
                        .toLowerCase()
                        .includes(q),
            );
    }, [items, tab, alert, query]);
    const count = (k: ItemKind) => items.filter((i) => i.kind === k).length;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-text-secondary">
                    Medicamentos e insumos. Cada aplicación a un paciente
                    descuenta existencia y genera un cargo.
                </p>
                <div className="flex flex-wrap gap-2">
                    <Link href={suppliersRoute.url()} className={secondary}>
                        <Truck className="h-4 w-4" />
                        Proveedores
                    </Link>
                    <Link href={entrada.url()} className={secondary}>
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
            <CatalogStats items={items} value={alert} onChange={setAlert} />
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
                <CatalogTable
                    rows={rows}
                    canEdit={can_edit}
                    onEdit={setEditing}
                    onAdjust={setAdjusting}
                />
                {rows.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        {items.length === 0
                            ? 'El catálogo está vacío. Agrega el primer artículo o registra una entrada.'
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
            {adjusting && (
                <AdjustDialog
                    item={adjusting}
                    reasons={adjustment_reasons}
                    onClose={() => setAdjusting(null)}
                />
            )}
        </div>
    );
}
