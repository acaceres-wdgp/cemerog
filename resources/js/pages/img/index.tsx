import React, { FormEvent, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { ChevronRight, Plus, Search } from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import ImgStatusPill from '@/components/img/ImgStatusPill';
import { IMG_STATUS, isImagingPending } from '@/components/img/types';
import type {
    ImagingOrderSummary,
    ImagingPatient,
    ImagingStatus,
} from '@/components/img/types';
import { ageLabel } from '@/lib/patient';
import { cn } from '@/lib/utils';
import { img, registro } from '@/routes';
import * as orders from '@/routes/img/orders';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';
const RANGES = [
    { value: '7', label: '7 días' },
    { value: '30', label: '30 días' },
    { value: 'todo', label: 'Todo' },
];
const STATUSES: ImagingStatus[] = [
    'ordenada',
    'realizado',
    'borrador',
    'listo',
    'entregado',
    'cancelada',
];

type Row = ImagingOrderSummary & { patient: ImagingPatient };
type Filters = { q: string; rango: string; estado: string };
type Pagination = {
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

/** Imágenes: every study, pending first; a row opens the patient view */
export default function ImgIndex({
    orders: rows = [],
    pagination = {
        current_page: 1,
        last_page: 1,
        total: 0,
        from: null,
        to: null,
    },
    counts = {},
    pending = 0,
    filters = { q: '', rango: '30', estado: 'todos' },
}: {
    orders?: Row[];
    pagination?: Pagination;
    counts?: Partial<Record<ImagingStatus, number>>;
    pending?: number;
    filters?: Filters;
}) {
    const [q, setQ] = useState(filters.q);
    // The walk-in patient is registered in Registro («Solo análisis o imágenes»)
    const canRegister = (usePage().props.permissions ?? []).includes(
        'module.registro.access',
    );
    const visit = (patch: Partial<Filters> & { page?: number }) =>
        router.get(
            img.url({
                query: {
                    q: (patch.q ?? q) || undefined,
                    rango: patch.rango ?? filters.rango,
                    estado: patch.estado ?? filters.estado,
                    page: patch.page,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    const search = (e: FormEvent) => {
        e.preventDefault();
        visit({ q, page: 1 });
    };
    const total = Object.values(counts).reduce((a, n) => a + (n ?? 0), 0);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="m-0 text-text-secondary">
                    {pending}{' '}
                    {pending === 1
                        ? 'estudio pendiente'
                        : 'estudios pendientes'}{' '}
                    de imagen o informe · haz clic en una fila para ver todos
                    los estudios del paciente.
                </p>
                {canRegister && (
                    <Link
                        href={registro.url({ query: { tipo: 'imagenes' } })}
                        className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-primary px-[14px] font-medium whitespace-nowrap text-white hover:bg-primary-hover"
                    >
                        <Plus className="h-4 w-4" />
                        Orden sin consulta
                    </Link>
                )}
            </div>
            <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
                <div className="flex flex-wrap items-center gap-3 px-5 pt-4">
                    <form
                        onSubmit={search}
                        className="flex h-10 min-w-[300px] flex-1 items-center gap-2 rounded-[10px] border border-input-border px-3 focus-within:border-primary"
                    >
                        <Search className="h-4 w-4 text-muted" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar por paciente, cédula, No. de orden o estudio…"
                            aria-label="Buscar estudios"
                            className="w-full border-0 bg-transparent outline-none"
                        />
                    </form>
                    <SegmentedControl
                        segments={RANGES}
                        value={filters.rango}
                        onChange={(rango) => visit({ rango, page: 1 })}
                    />
                </div>
                <div className="px-5 py-3">
                    <SegmentedControl
                        segments={[
                            { value: 'todos', label: 'Todos', count: total },
                            ...STATUSES.map((s) => ({
                                value: s,
                                label: IMG_STATUS[s].label,
                                count: counts[s] ?? 0,
                            })),
                        ]}
                        value={filters.estado}
                        onChange={(estado) => visit({ estado, page: 1 })}
                    />
                </div>
                <table className="w-full min-w-[960px] border-collapse text-[14px]">
                    <thead>
                        <tr>
                            <th className={`${th} pl-5 text-left`}>Orden</th>
                            <th className={`${th} text-left`}>Paciente</th>
                            <th className={`${th} text-left`}>Estudio</th>
                            <th className={`${th} text-left`}>Origen</th>
                            <th className={`${th} text-left`}>Ordenado por</th>
                            <th className={`${th} text-left`}>Estado</th>
                            <th className={`${th} pr-5`}>
                                <span className="sr-only">Abrir</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((o) => (
                            <tr
                                key={o.id}
                                onClick={() =>
                                    router.visit(orders.show.url(o.id))
                                }
                                className={cn(
                                    'cursor-pointer hover:bg-list-row-bg',
                                    isImagingPending(o.status) &&
                                        'bg-list-row-bg',
                                )}
                            >
                                <td className={`${td} pl-5`}>
                                    <div className="font-mono font-semibold whitespace-nowrap">
                                        {o.number}
                                    </div>
                                    <div className="text-[12.5px] text-muted">
                                        {o.ordered_date} · {o.ordered_time}
                                    </div>
                                </td>
                                <td className={td}>
                                    <div className="font-medium text-text-heading">
                                        {o.patient.full_name}
                                    </div>
                                    <div className="text-[12.5px] text-text-tertiary">
                                        {[
                                            o.patient.document_number,
                                            ageLabel(o.patient.age),
                                        ]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </div>
                                </td>
                                <td className={td}>{o.name}</td>
                                <td className={td}>{o.origin}</td>
                                <td className={`${td} text-[13px]`}>
                                    {o.doctor ?? '—'}
                                </td>
                                <td className={td}>
                                    <ImgStatusPill status={o.status} />
                                </td>
                                <td
                                    className={`${td} pr-5 text-right text-muted`}
                                >
                                    <ChevronRight className="inline h-4 w-4" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="p-8 text-center text-muted">
                        Ningún estudio coincide con los filtros.
                    </div>
                )}
                <div className="flex items-center justify-between gap-3 px-5 py-3 text-[13px] text-muted">
                    <span>
                        {pagination.total === 0
                            ? '0 estudios'
                            : `Mostrando ${pagination.from}–${pagination.to} de ${pagination.total} estudios`}
                    </span>
                    {pagination.last_page > 1 && (
                        <div className="flex gap-1">
                            {Array.from(
                                { length: pagination.last_page },
                                (_, i) => i + 1,
                            ).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    aria-current={p === pagination.current_page}
                                    onClick={() => visit({ page: p })}
                                    className={`h-8 min-w-8 cursor-pointer rounded-lg border px-2 ${p === pagination.current_page ? 'border-primary bg-primary text-white' : 'border-card-border bg-white'}`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
