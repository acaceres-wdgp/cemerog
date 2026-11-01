import React, { FormEvent, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import * as rooms from '@/routes/admin/cirugias/rooms';
import ProcedureDialog from './ProcedureDialog';

export type ProcedureRow = {
    id: number;
    code: string;
    name: string;
    price: number;
    duration_minutes: number;
    is_active: boolean;
};

type OperatingRoomRow = { id: number; name: string; is_active: boolean };

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';
const opts = { preserveScroll: true, preserveState: true };

/** Administración › Catálogo de cirugías */
export default function AdminCirugiasIndex({
    procedures = [],
    operating_rooms = [],
    next_code = 'Q-01',
}: {
    procedures?: ProcedureRow[];
    operating_rooms?: OperatingRoomRow[];
    next_code?: string;
}) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [editing, setEditing] = useState<ProcedureRow | 'new' | null>(null);
    const [room, setRoom] = useState('');

    const addRoom = (e: FormEvent) => {
        e.preventDefault();
        router.post(
            rooms.store.url(),
            { name: room.trim() },
            { ...opts, onSuccess: () => setRoom('') },
        );
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-text-secondary">
                    {procedures.length} procedimientos · el precio incluye el
                    uso del quirófano y se carga al realizarse.
                </p>
                <button
                    type="button"
                    onClick={() => setEditing('new')}
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium text-white hover:bg-primary-hover"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo procedimiento
                </button>
            </div>
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
                <table className="w-full min-w-[680px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Código</th>
                            <th className={`${th} text-left`}>Procedimiento</th>
                            <th className={`${th} text-right`}>Duración</th>
                            <th className={`${th} text-right`}>Precio</th>
                            <th className={`${th} text-left`}>Estado</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Editar</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {procedures.map((p) => (
                            <tr
                                key={p.id}
                                className={cn(!p.is_active && 'text-muted')}
                            >
                                <td
                                    className={`${td} pl-5 font-mono text-[12.5px]`}
                                >
                                    {p.code}
                                </td>
                                <td
                                    className={`${td} font-medium text-text-heading`}
                                >
                                    {p.name}
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {p.duration_minutes} min
                                </td>
                                <td className={`${td} text-right tabular-nums`}>
                                    {formatMoney(p.price)}
                                </td>
                                <td className={td}>
                                    {p.is_active ? 'Activo' : 'Inactivo'}
                                </td>
                                <td className={`${td} pr-5 text-right`}>
                                    <button
                                        type="button"
                                        aria-label={`Editar ${p.name}`}
                                        onClick={() => setEditing(p)}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-card-border bg-white text-text-secondary hover:bg-app-bg"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {procedures.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        El catálogo está vacío. Agrega el primer procedimiento.
                    </div>
                )}
            </section>
            <section className="rounded-[14px] border border-card-border bg-white px-5 py-4">
                <h2 className="m-0 mb-2 font-serif text-[16px] font-semibold text-text-heading">
                    Quirófanos
                </h2>
                {operating_rooms.map((r) => (
                    <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 border-b border-divider py-2 last:border-b-0"
                    >
                        <span
                            className={cn(
                                'font-medium',
                                !r.is_active && 'text-muted',
                            )}
                        >
                            {r.name}
                        </span>
                        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                            <input
                                type="checkbox"
                                checked={r.is_active}
                                aria-label={`${r.name} activo`}
                                onChange={(e) =>
                                    router.put(
                                        rooms.update.url(r.id),
                                        {
                                            name: r.name,
                                            is_active: e.target.checked,
                                        },
                                        opts,
                                    )
                                }
                            />
                            Activo
                        </label>
                    </div>
                ))}
                <form onSubmit={addRoom} className="mt-3 flex gap-2">
                    <input
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="Ej.: Quirófano 2"
                        aria-label="Nuevo quirófano"
                        className="h-9 min-w-0 flex-1 rounded-lg border border-input-border px-3 outline-none focus:border-primary"
                    />
                    <button
                        type="submit"
                        disabled={room.trim() === ''}
                        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-secondary-border bg-secondary-bg px-[14px] font-medium hover:bg-accent-bg disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar quirófano
                    </button>
                </form>
                {errors.name && (
                    <p className="m-0 mt-1 text-[12px] text-error">
                        {errors.name}
                    </p>
                )}
            </section>
            {editing && (
                <ProcedureDialog
                    procedure={editing === 'new' ? null : editing}
                    nextCode={next_code}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
