import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { facturas } from '@/routes';
import InvoiceDrawer from './components/InvoiceDrawer';
import InvoiceKpiCards from './components/InvoiceKpiCards';
import InvoicesTable from './components/InvoicesTable';
import type {
    FacturasProps,
    InvoiceFilters,
    Period,
    StateFilter,
} from './types';

const PERIODS: [Period, string][] = [
    ['hoy', 'Hoy'],
    ['semana', '7 días'],
    ['mes', 'Este mes'],
    ['todo', 'Todo'],
];
const STATES: [StateFilter, string][] = [
    ['todas', 'Todas'],
    ['pendiente', 'Con balance'],
    ['pagada', 'Saldadas'],
    ['anulada', 'Anuladas'],
];
const DEFAULTS: InvoiceFilters = {
    periodo: 'mes',
    estado: 'todas',
    area: '',
    condicion: '',
    cajero: '',
    q: '',
};

/** Only what differs from the defaults goes in the URL */
function queryOf(filters: InvoiceFilters, extra: Record<string, string> = {}) {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value !== DEFAULTS[key as keyof InvoiceFilters]) {
            query[key] = String(value);
        }
    }

    return { ...query, ...extra };
}

const segment = (active: boolean) =>
    cn(
        'h-[30px] cursor-pointer rounded-lg border-0 px-3 text-[13px] font-medium whitespace-nowrap',
        active
            ? 'bg-white text-text-heading shadow-sm'
            : 'bg-transparent text-text-secondary',
    );
const select =
    'h-9 min-w-0 cursor-pointer rounded-[10px] border border-input-border bg-white pr-8 pl-[10px] text-[13px] text-text-heading';

/** Caja › Facturas: every issued invoice with its filters and detail */
export default function FacturasIndex({
    filters,
    period_label,
    invoices,
    kpis,
    totals,
    counts,
    areas,
    cashiers,
    selected_invoice,
}: FacturasProps) {
    const [search, setSearch] = useState(filters.q);
    const [openId, setOpenId] = useState<number | null>(
        selected_invoice?.id ?? null,
    );

    const visit = (next: Partial<InvoiceFilters>, page?: number) =>
        router.get(
            facturas.url({
                query: queryOf(
                    { ...filters, ...next },
                    page && page > 1 ? { page: String(page) } : {},
                ),
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );

    // Search once the user stops typing
    const typed = useRef(false);
    useEffect(() => {
        if (!typed.current) return;
        const timer = setTimeout(() => visit({ q: search.trim() }), 350);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const open = (id: number) => {
        setOpenId(id);
        router.get(
            facturas.url({
                query: queryOf(filters, { factura: String(id) }),
            }),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['selected_invoice'],
            },
        );
    };

    const hasFilters =
        filters.area !== '' ||
        filters.condicion !== '' ||
        filters.cajero !== '' ||
        filters.q !== '';
    const page = invoices.current_page;
    const drawer =
        selected_invoice && selected_invoice.id === openId
            ? selected_invoice
            : null;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <div
                    role="group"
                    aria-label="Periodo"
                    className="inline-flex gap-[2px] rounded-[11px] border border-card-border bg-app-bg p-[3px]"
                >
                    {PERIODS.map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={filters.periodo === key}
                            onClick={() => visit({ periodo: key })}
                            className={segment(filters.periodo === key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <span className="text-[13px] text-text-secondary">
                    {period_label}
                </span>
            </div>

            <InvoiceKpiCards kpis={kpis} />

            <section className="overflow-hidden rounded-[14px] border border-card-border bg-white shadow-sm">
                <div className="flex flex-col gap-[10px] border-b border-divider px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div
                            role="group"
                            aria-label="Estado de la factura"
                            className="inline-flex flex-wrap gap-[2px] rounded-[11px] border border-card-border bg-app-bg p-[3px]"
                        >
                            {STATES.map(([key, label]) => (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={filters.estado === key}
                                    onClick={() => visit({ estado: key })}
                                    className={segment(filters.estado === key)}
                                >
                                    {label}{' '}
                                    <span className="text-muted tabular-nums">
                                        {counts[key]}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <span className="text-[13px] text-text-secondary">
                            {invoices.total}{' '}
                            {invoices.total === 1 ? 'factura' : 'facturas'}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[220px] flex-[1_1_280px]">
                            <Search
                                aria-hidden
                                className="absolute top-[10px] left-[10px] h-4 w-4 text-muted"
                            />
                            <input
                                type="search"
                                aria-label="Buscar factura"
                                value={search}
                                onChange={(e) => {
                                    typed.current = true;
                                    setSearch(e.target.value);
                                }}
                                placeholder="Paciente, cédula o No. de factura"
                                className="h-9 w-full rounded-[10px] border border-input-border bg-white pr-3 pl-[34px] outline-none focus:border-primary"
                            />
                        </div>
                        <select
                            aria-label="Área"
                            value={filters.area}
                            onChange={(e) => visit({ area: e.target.value })}
                            className={select}
                        >
                            <option value="">Todas las áreas</option>
                            {areas.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                        <select
                            aria-label="Condición"
                            value={filters.condicion}
                            onChange={(e) =>
                                visit({
                                    condicion: e.target
                                        .value as InvoiceFilters['condicion'],
                                })
                            }
                            className={select}
                        >
                            <option value="">Contado y crédito</option>
                            <option value="contado">Contado</option>
                            <option value="credito">Crédito</option>
                        </select>
                        <select
                            aria-label="Cajero"
                            value={filters.cajero}
                            onChange={(e) =>
                                visit({
                                    cajero:
                                        e.target.value === ''
                                            ? ''
                                            : Number(e.target.value),
                                })
                            }
                            className={select}
                        >
                            <option value="">Todos los cajeros</option>
                            {cashiers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {hasFilters && (
                            <button
                                type="button"
                                onClick={() => {
                                    typed.current = false;
                                    setSearch('');
                                    visit({
                                        area: '',
                                        condicion: '',
                                        cajero: '',
                                        q: '',
                                    });
                                }}
                                className="h-9 cursor-pointer border-0 bg-transparent px-[10px] text-[13px] font-medium text-primary underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <InvoicesTable
                        rows={invoices.data}
                        selectedId={drawer?.id ?? null}
                        onOpen={open}
                    />
                </div>
                {invoices.data.length === 0 && (
                    <div className="p-9 text-center text-text-secondary">
                        No hay facturas para este filtro.
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-divider bg-list-row-bg px-5 py-3 tabular-nums">
                    <div className="flex items-center gap-[10px] text-[13px] text-text-secondary">
                        {invoices.total > 0 && (
                            <span>
                                Mostrando {invoices.from}–{invoices.to} de{' '}
                                {invoices.total}
                            </span>
                        )}
                        <button
                            type="button"
                            aria-label="Página anterior"
                            disabled={page <= 1}
                            onClick={() => visit({}, page - 1)}
                            className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-secondary-border bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span>
                            Página {page} de {invoices.last_page}
                        </span>
                        <button
                            type="button"
                            aria-label="Página siguiente"
                            disabled={page >= invoices.last_page}
                            onClick={() => visit({}, page + 1)}
                            className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-lg border border-secondary-border bg-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-[22px] text-[13px] text-text-secondary">
                        <span>
                            Facturado{' '}
                            <b className="font-semibold text-text-heading">
                                {formatMoney(totals.billed)}
                            </b>
                        </span>
                        <span>
                            Cobrado{' '}
                            <b className="font-semibold text-text-heading">
                                {formatMoney(totals.collected)}
                            </b>
                        </span>
                        <span>
                            Pendiente{' '}
                            <b className="state-pendiente text-[15px] font-bold text-[var(--state-text)]">
                                {formatMoney(totals.pending)}
                            </b>
                        </span>
                    </div>
                </div>
            </section>

            {drawer && (
                <InvoiceDrawer
                    invoice={drawer}
                    onClose={() => setOpenId(null)}
                />
            )}
        </div>
    );
}
