import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Tags } from 'lucide-react';
import CategoriesDialog from '@/components/catalog/CategoriesDialog';
import type { CategoryItem } from '@/components/catalog/CategoriesDialog';
import * as cats from '@/routes/analisis/categorias';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import LabTestDialog from './components/LabTestDialog';
import type { LabTestRow } from './types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** Administración › Catálogo de análisis */
export default function AnalisisIndex({
    tests = [],
    categories = [],
    category_items = [],
}: {
    tests?: LabTestRow[];
    categories?: string[];
    category_items?: CategoryItem[];
}) {
    const [managing, setManaging] = useState(false);
    const [category, setCategory] = useState('todas');
    const [query, setQuery] = useState('');
    const [editing, setEditing] = useState<LabTestRow | 'new' | null>(null);

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tests
            .filter((t) => category === 'todas' || t.category === category)
            .filter(
                (t) =>
                    q === '' || `${t.code} ${t.name}`.toLowerCase().includes(q),
            );
    }, [tests, category, query]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <label className="flex h-10 w-[280px] items-center gap-2 rounded-[10px] border border-input-border bg-white px-3 focus-within:border-primary">
                        <Search className="h-4 w-4 text-muted" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar análisis o código…"
                            aria-label="Buscar análisis o código"
                            className="w-full border-0 bg-transparent outline-none"
                        />
                    </label>
                    <SegmentedControl
                        segments={[
                            {
                                value: 'todas',
                                label: 'Todas',
                                count: tests.length,
                            },
                            ...categories.map((c) => ({
                                value: c,
                                label: c,
                                count: tests.filter((t) => t.category === c)
                                    .length,
                            })),
                        ]}
                        value={category}
                        onChange={setCategory}
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setManaging(true)}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium text-text-body hover:bg-accent-bg"
                    >
                        <Tags className="h-4 w-4" />
                        Categorías
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditing('new')}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo análisis
                    </button>
                </div>
            </div>
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
                <table className="w-full min-w-[960px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Código</th>
                            <th className={`${th} text-left`}>Análisis</th>
                            <th className={`${th} text-left`}>Categoría</th>
                            <th className={`${th} text-left`}>Parámetros</th>
                            <th className={`${th} text-left`}>Preparación</th>
                            <th className={`${th} text-right`}>Precio</th>
                            <th className={`${th} text-left`}>Estado</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Editar</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((t) => (
                            <tr
                                key={t.id}
                                className={cn(!t.is_active && 'text-muted')}
                            >
                                <td
                                    className={`${td} pl-5 font-mono text-[12.5px]`}
                                >
                                    {t.code}
                                </td>
                                <td
                                    className={`${td} font-medium text-text-heading`}
                                >
                                    {t.name}
                                </td>
                                <td className={td}>
                                    <span className="rounded-full bg-accent-bg px-[10px] py-[3px] text-[12px] font-medium text-accent-fg">
                                        {t.category}
                                    </span>
                                </td>
                                <td
                                    className={`${td} max-w-[260px] text-[13px] text-text-secondary`}
                                >
                                    {t.parameters.length === 1
                                        ? t.parameters[0].reference
                                        : `${t.parameters.length} parámetros`}
                                </td>
                                <td
                                    className={`${td} max-w-[260px] text-[13px] text-text-secondary`}
                                >
                                    {t.preparation ?? '—'}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {formatMoney(t.price)}
                                </td>
                                <td className={td}>
                                    {t.is_active ? 'Activo' : 'Inactivo'}
                                </td>
                                <td className={`${td} pr-5 text-right`}>
                                    <button
                                        type="button"
                                        aria-label={`Editar ${t.name}`}
                                        onClick={() => setEditing(t)}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        {tests.length === 0
                            ? 'El catálogo está vacío. Agrega el primer análisis.'
                            : 'Ningún análisis coincide con la búsqueda.'}
                    </div>
                )}
            </section>
            <p className="m-0 text-[13px] text-muted">
                Los análisis activos aparecen al ordenar estudios en Consulta y
                Emergencia. Al desactivar uno, deja de ofrecerse pero se
                conserva en los resultados históricos.
            </p>
            <CategoriesDialog
                open={managing}
                onOpenChange={setManaging}
                title="Categorías de laboratorio"
                description="Ordenan el catálogo y el diálogo de «Ordenar estudios». Al renombrar una, sus análisis la siguen."
                placeholder="Ej.: Inmunología"
                items={category_items}
                routes={{
                    store: cats.store.url(),
                    update: (id) => cats.update.url(id),
                    move: (id) => cats.move.url(id),
                    destroy: (id) => cats.destroy.url(id),
                }}
            />
            {editing && (
                <LabTestDialog
                    test={editing === 'new' ? null : editing}
                    categories={categories}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
