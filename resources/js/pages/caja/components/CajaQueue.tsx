import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { BillableAccount, InvoiceSummary } from '../types';

export type Selection =
    | { kind: 'account'; id: number }
    | { kind: 'invoice'; id: number }
    | null;

type Group = 'pendiente' | 'balance' | 'atencion' | 'saldada' | 'anulada';
type Tab = 'cobrar' | 'atencion' | 'saldadas';

const GROUPS: { key: Group; label: string; tab: Tab }[] = [
    { key: 'pendiente', label: 'Pendientes de facturar', tab: 'cobrar' },
    { key: 'balance', label: 'Facturadas con balance', tab: 'cobrar' },
    { key: 'atencion', label: 'En atención', tab: 'atencion' },
    { key: 'saldada', label: 'Saldadas hoy', tab: 'saldadas' },
    { key: 'anulada', label: 'Anuladas hoy', tab: 'saldadas' },
];
const TAB_OF = Object.fromEntries(GROUPS.map((g) => [g.key, g.tab])) as Record<
    Group,
    Tab
>;

const TABS: { key: Tab; label: string; foot: string }[] = [
    { key: 'cobrar', label: 'Por cobrar', foot: 'Total por cobrar' },
    { key: 'atencion', label: 'En atención', foot: 'Acumulado en atención' },
    { key: 'saldadas', label: 'Saldadas', foot: 'Cobrado hoy' },
];

/** Avatar colors follow the state of the account */
const TONE: Record<Group, string> = {
    pendiente: 'state-pendiente',
    balance: 'state-balance',
    saldada: 'state-saldada',
    atencion: 'state-cancelada',
    anulada: 'state-cancelada',
};

type Item = {
    key: string;
    selection: NonNullable<Selection>;
    group: Group;
    patient: string;
    /** Expediente of an account, number of an invoice */
    reference: string;
    detail: string;
    amount: number;
};

const dayMonth = (date: string) => date.slice(0, 5);

const normalize = (s: string) =>
    s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

function initials(name: string): string {
    const words = name.split(/\s+/).filter(Boolean);

    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}

function toItems(
    pending: BillableAccount[],
    inCare: BillableAccount[],
    invoices: InvoiceSummary[],
): Item[] {
    const accountItem =
        (group: Group) =>
        (a: BillableAccount): Item => ({
            key: `a${a.id}`,
            selection: { kind: 'account', id: a.id },
            group,
            patient: a.patient.full_name,
            reference: a.patient.expediente_number,
            detail: `Atención ${dayMonth(a.service_date)}`,
            amount: a.total,
        });

    return [
        ...pending.map(accountItem('pendiente')),
        ...inCare.map(accountItem('atencion')),
        ...invoices.map((i): Item => {
            const group: Group =
                i.status === 'pendiente'
                    ? 'balance'
                    : i.status === 'pagada'
                      ? 'saldada'
                      : 'anulada';
            const issuedTime = i.issued_at.split(' ').slice(1).join(' ');

            return {
                key: `i${i.id}`,
                selection: { kind: 'invoice', id: i.id },
                group,
                patient: i.patient,
                reference: i.number,
                detail:
                    group === 'balance'
                        ? i.credit_due_date
                            ? `Compromiso ${dayMonth(i.credit_due_date)}`
                            : `Facturada ${dayMonth(i.issued_at)}`
                        : group === 'saldada'
                          ? `Facturada ${issuedTime}`
                          : 'Anulada',
                amount: group === 'balance' ? i.balance : i.total,
            };
        }),
    ];
}

const sameSelection = (a: Selection, b: Selection) =>
    a !== null && b !== null && a.kind === b.kind && a.id === b.id;

/**
 * «Cuentas en caja»: search, tabs Por cobrar / En atención / Saldadas,
 * the accounts grouped by state and the total of what is listed.
 */
export default function CajaQueue({
    pending,
    inCare,
    invoices,
    selection,
    onSelect,
}: {
    pending: BillableAccount[];
    inCare: BillableAccount[];
    invoices: InvoiceSummary[];
    selection: Selection;
    onSelect: (selection: Selection) => void;
}) {
    const items = toItems(pending, inCare, invoices);
    const [tab, setTab] = useState<Tab>('cobrar');
    const [query, setQuery] = useState('');

    // An account selected from outside (e.g. the invoice just emitted)
    // brings its tab along
    const selectedGroup = items.find((i) =>
        sameSelection(i.selection, selection),
    )?.group;
    const selectionKey = selection ? `${selection.kind}${selection.id}` : '';
    useEffect(() => {
        if (selectedGroup) setTab(TAB_OF[selectedGroup]);
        // Only when the selection changes, not when the user picks a tab
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectionKey]);

    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    const searching = terms.length > 0;
    const visible = items.filter((i) =>
        searching
            ? terms.every((t) =>
                  normalize(`${i.patient} ${i.reference}`).includes(t),
              )
            : TAB_OF[i.group] === tab,
    );
    const groups = GROUPS.map((g) => ({
        ...g,
        rows: visible.filter((i) => i.group === g.key),
    })).filter((g) => g.rows.length > 0);
    // Voided invoices are listed but are not money
    const sum = visible
        .filter((i) => i.group !== 'anulada')
        .reduce((total, i) => total + i.amount, 0);
    const counted = visible.filter((i) => i.group !== 'anulada').length;

    return (
        <section
            aria-label="Cuentas en caja"
            className="flex min-h-[420px] flex-col overflow-hidden rounded-[14px] border border-card-border bg-white shadow-sm lg:h-[calc(100vh-96px)]"
        >
            <div className="flex flex-none flex-col gap-[10px] border-b border-divider px-[14px] pt-[14px] pb-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="m-0 text-[15px] font-semibold text-text-heading">
                        Cuentas en caja
                    </h2>
                    <span className="rounded-full border border-card-border bg-app-bg px-2 py-[2px] text-[12px] text-text-secondary tabular-nums">
                        {items.length} en caja
                    </span>
                </div>
                <div className="relative">
                    <Search
                        aria-hidden
                        className="absolute top-[9px] left-[10px] h-4 w-4 text-muted"
                    />
                    <input
                        type="search"
                        aria-label="Buscar cuenta"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Paciente o No. de factura…"
                        className="h-[34px] w-full rounded-[10px] border border-input-border bg-white pr-[30px] pl-8 text-[13px] outline-none focus:border-primary [&::-webkit-search-cancel-button]:hidden"
                    />
                    {query !== '' && (
                        <button
                            type="button"
                            aria-label="Limpiar búsqueda"
                            onClick={() => setQuery('')}
                            className="absolute top-[6px] right-[6px] h-[22px] w-[22px] cursor-pointer rounded-md border-0 bg-secondary-bg text-[13px] leading-none text-text-secondary"
                        >
                            ×
                        </button>
                    )}
                </div>
                <div className="flex gap-[2px] rounded-[11px] border border-card-border bg-app-bg p-[3px]">
                    {TABS.map((t) => {
                        const active = !searching && tab === t.key;
                        return (
                            <button
                                key={t.key}
                                type="button"
                                aria-pressed={active}
                                onClick={() => {
                                    setTab(t.key);
                                    setQuery('');
                                }}
                                className={cn(
                                    'h-7 flex-1 cursor-pointer rounded-lg border-0 px-1.5 text-[12.5px] font-medium whitespace-nowrap',
                                    active
                                        ? 'bg-white text-text-heading shadow-sm'
                                        : 'bg-transparent text-text-secondary',
                                )}
                            >
                                {t.label}{' '}
                                <span className="text-muted tabular-nums">
                                    {
                                        items.filter(
                                            (i) => TAB_OF[i.group] === t.key,
                                        ).length
                                    }
                                </span>
                            </button>
                        );
                    })}
                </div>
                {searching && (
                    <div className="text-[12px] text-text-secondary">
                        {visible.length}{' '}
                        {visible.length === 1 ? 'resultado' : 'resultados'} en
                        todas las cuentas
                    </div>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                {groups.length === 0 && (
                    <div className="mx-2 my-6 rounded-[10px] border border-dashed border-input-border px-3 py-[18px] text-center text-[13px] text-text-secondary">
                        {searching
                            ? 'No hay cuentas que coincidan.'
                            : 'No hay cuentas aquí.'}
                    </div>
                )}
                {groups.map((g) => (
                    <div key={g.key}>
                        <div className="sticky top-0 z-[1] flex items-center justify-between bg-white px-2 pt-3 pb-1.5 text-[11px] font-semibold tracking-[.05em] text-accent-fg uppercase">
                            <span>{g.label}</span>
                            <span className="tabular-nums">
                                {g.rows.length}
                            </span>
                        </div>
                        {g.rows.map((item) => {
                            const active = sameSelection(
                                item.selection,
                                selection,
                            );
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    data-row
                                    aria-current={active ? 'true' : undefined}
                                    onClick={() => onSelect(item.selection)}
                                    className={cn(
                                        'mb-[2px] flex w-full cursor-pointer items-center gap-[10px] rounded-[10px] border-0 border-l-[3px] py-2 pr-[10px] pl-2 text-left',
                                        active
                                            ? 'border-l-primary bg-accent-bg'
                                            : 'border-l-transparent bg-transparent hover:bg-list-row-bg',
                                    )}
                                >
                                    <span
                                        aria-hidden
                                        className={cn(
                                            TONE[item.group],
                                            'inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[var(--state-bg)] text-[11px] font-semibold text-[var(--state-text)]',
                                        )}
                                    >
                                        {initials(item.patient)}
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span
                                                className={cn(
                                                    'truncate text-[13.5px] text-text-heading',
                                                    active
                                                        ? 'font-semibold'
                                                        : 'font-medium',
                                                )}
                                            >
                                                {item.patient}
                                            </span>
                                            <span className="flex-none text-[13px] font-medium text-text-heading tabular-nums">
                                                {formatMoney(item.amount)}
                                            </span>
                                        </span>
                                        <span className="flex justify-between gap-2 text-[11.5px] text-text-secondary">
                                            <span className="whitespace-nowrap tabular-nums">
                                                {item.reference}
                                            </span>
                                            <span className="truncate">
                                                {item.detail}
                                            </span>
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div
                data-testid="queue-total"
                className="flex flex-none items-center justify-between gap-2 border-t border-divider bg-list-row-bg px-4 py-[10px]"
            >
                <span className="flex flex-col">
                    <span className="text-[12px] font-semibold text-accent-fg">
                        {searching
                            ? 'Total de resultados'
                            : TABS.find((t) => t.key === tab)?.foot}
                    </span>
                    <span className="text-[11.5px] text-text-secondary">
                        {counted} {counted === 1 ? 'cuenta' : 'cuentas'}
                    </span>
                </span>
                <span className="text-[15px] font-semibold text-text-heading tabular-nums">
                    {formatMoney(sum)}
                </span>
            </div>
        </section>
    );
}
