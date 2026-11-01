import React, { FormEvent, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Printer, Search } from 'lucide-react';
import SegmentedControl from '@/components/cemerog/SegmentedControl';
import { lab } from '@/routes';
import * as orders from '@/routes/lab/orders';
import type { LabHistory as History } from '../types';

const th =
    'h-10 border-b border-accent-tip-border bg-table-header-bg px-3 text-[11.5px] font-semibold tracking-[.05em] whitespace-nowrap text-table-header-text uppercase';
const td = 'border-b border-divider p-3 align-middle';
const RANGES = [
    { value: '7', label: '7 días' },
    { value: '30', label: '30 días' },
    { value: '90', label: '90 días' },
    { value: '0', label: 'Todo' },
];

type Filters = { q: string; prueba: number | null; rango: string };

/** «Historial»: validated results, searchable */
export default function LabHistory({
    history,
    tests,
    filters,
}: {
    history: History;
    tests: { id: number; name: string }[];
    filters: Filters;
}) {
    const [q, setQ] = useState(filters.q);
    const visit = (patch: Partial<Filters> & { page?: number }) =>
        router.get(
            lab.url({
                query: {
                    vista: 'historial',
                    q: (patch.q ?? q) || undefined,
                    prueba:
                        (patch.prueba !== undefined
                            ? patch.prueba
                            : filters.prueba) ?? undefined,
                    rango: patch.rango ?? filters.rango,
                    page: patch.page,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    const search = (e: FormEvent) => {
        e.preventDefault();
        visit({ q });
    };

    return (
        <section className="overflow-x-auto rounded-[14px] border border-card-border bg-white">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <form
                    onSubmit={search}
                    className="flex h-10 min-w-[300px] flex-1 items-center gap-2 rounded-[10px] border border-input-border px-3 focus-within:border-primary"
                >
                    <Search className="h-4 w-4 text-muted" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Buscar por paciente, cédula, No. de orden o prueba…"
                        aria-label="Buscar en el historial"
                        className="w-full border-0 bg-transparent outline-none"
                    />
                </form>
                <select
                    aria-label="Filtrar por prueba"
                    value={filters.prueba ?? ''}
                    onChange={(e) =>
                        visit({ prueba: Number(e.target.value) || null })
                    }
                    className="h-10 rounded-[10px] border border-input-border bg-white px-3 outline-none"
                >
                    <option value="">Todas las pruebas</option>
                    {tests.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.name}
                        </option>
                    ))}
                </select>
                <SegmentedControl
                    segments={RANGES}
                    value={filters.rango}
                    onChange={(rango) => visit({ rango })}
                />
            </div>
            <table className="w-full min-w-[960px] border-collapse text-[14px]">
                <thead>
                    <tr>
                        <th className={`${th} pl-5 text-left`}>Orden</th>
                        <th className={`${th} text-left`}>Paciente</th>
                        <th className={`${th} text-left`}>Pruebas</th>
                        <th className={`${th} text-left`}>Origen</th>
                        <th className={`${th} text-left`}>Médico</th>
                        <th className={`${th} text-left`}>Validado</th>
                        <th className={`${th} pr-5`}>
                            <span className="sr-only">Acciones</span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {history.data.map((o) => (
                        <tr key={o.id}>
                            <td className={`${td} pl-5`}>
                                <div className="font-mono font-semibold whitespace-nowrap">
                                    {o.number}
                                </div>
                                <div className="text-[12.5px] text-muted">
                                    {o.ordered_date}
                                </div>
                            </td>
                            <td className={td}>
                                <div className="font-medium text-text-heading">
                                    {o.patient.full_name}
                                </div>
                                <div className="text-[12.5px] text-text-tertiary">
                                    {o.patient.document_number ?? '—'}
                                </div>
                            </td>
                            <td className={`${td} text-[13px]`}>
                                {o.tests.join(' · ')}
                            </td>
                            <td className={td}>{o.origin}</td>
                            <td className={`${td} text-[13px]`}>
                                {o.doctor ?? '—'}
                            </td>
                            <td className={td}>
                                <div className="text-[13px] tabular-nums">
                                    {o.validated_at}
                                </div>
                                {o.has_out_of_range && (
                                    <div className="text-[12px] font-medium text-error">
                                        Valores fuera de rango
                                    </div>
                                )}
                            </td>
                            <td className={`${td} pr-5`}>
                                <div className="flex justify-end gap-1.5">
                                    <Link
                                        href={orders.show.url(o.id)}
                                        className="inline-flex h-8 items-center rounded-[10px] border border-secondary-border bg-secondary-bg px-3 text-[13px] font-medium"
                                    >
                                        Ver resultado
                                    </Link>
                                    <a
                                        href={orders.print.url(o.id)}
                                        target="_blank"
                                        rel="noreferrer"
                                        aria-label="Imprimir resultado"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-card-border text-text-secondary"
                                    >
                                        <Printer className="h-4 w-4" />
                                    </a>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {history.data.length === 0 && (
                <div className="p-8 text-center text-muted">
                    Ningún resultado coincide con la búsqueda.
                </div>
            )}
            <div className="flex items-center justify-between gap-3 px-5 py-3 text-[13px] text-muted">
                <span>
                    {history.total}{' '}
                    {history.total === 1 ? 'resultado' : 'resultados'}
                </span>
                {history.last_page > 1 && (
                    <div className="flex gap-1">
                        {Array.from(
                            { length: history.last_page },
                            (_, i) => i + 1,
                        ).map((p) => (
                            <button
                                key={p}
                                type="button"
                                aria-current={p === history.current_page}
                                onClick={() => visit({ page: p })}
                                className={`h-8 min-w-8 cursor-pointer rounded-lg border px-2 ${p === history.current_page ? 'border-primary bg-accent-bg text-primary' : 'border-card-border bg-white'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
