import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, Pencil, Plus } from 'lucide-react';
import StatusBadge from '@/components/cemerog/StatusBadge';
import { almacen } from '@/routes';
import SupplierDialog from './components/SupplierDialog';
import type { SupplierRow } from './components/SupplierDialog';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';

/** Inventario › Proveedores */
export default function Proveedores({
    suppliers,
    can_edit,
}: {
    suppliers: SupplierRow[];
    can_edit: boolean;
}) {
    const [editing, setEditing] = useState<SupplierRow | 'new' | null>(null);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                    href={almacen.url()}
                    className="inline-flex items-center gap-1 text-[14px] text-text-secondary hover:text-primary"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Catálogo
                </Link>
                {can_edit && (
                    <button
                        type="button"
                        onClick={() => setEditing('new')}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo proveedor
                    </button>
                )}
            </div>
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
                <table className="w-full min-w-[720px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>
                                Proveedor
                            </th>
                            <th className={`${th} text-left`}>RNC</th>
                            <th className={`${th} text-left`}>Teléfono</th>
                            <th className={`${th} text-left`}>Contacto</th>
                            <th className={`${th} text-right`}>Entradas</th>
                            <th className={`${th} text-left`}>Estado</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Editar</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map((s) => (
                            <tr key={s.id}>
                                <td
                                    className={`${td} pl-5 font-medium text-text-heading`}
                                >
                                    {s.name}
                                </td>
                                <td className={`${td} tabular-nums`}>
                                    {s.rnc ?? '—'}
                                </td>
                                <td className={`${td} tabular-nums`}>
                                    {s.phone ?? '—'}
                                </td>
                                <td className={td}>{s.contact ?? '—'}</td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {s.entries_count ?? 0}
                                </td>
                                <td className={td}>
                                    <StatusBadge
                                        state={
                                            s.is_active
                                                ? 'saldada'
                                                : 'cancelada'
                                        }
                                        label={
                                            s.is_active ? 'Activo' : 'Inactivo'
                                        }
                                    />
                                </td>
                                <td className={`${td} pr-5 text-right`}>
                                    {can_edit && (
                                        <button
                                            type="button"
                                            aria-label={`Editar ${s.name}`}
                                            onClick={() => setEditing(s)}
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
                {suppliers.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        Todavía no hay proveedores.
                    </div>
                )}
            </section>
            {editing && (
                <SupplierDialog
                    supplier={editing === 'new' ? null : editing}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
