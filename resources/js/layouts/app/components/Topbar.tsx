/**
 * Topbar – application top bar with breadcrumb, patient search, clock, notifications, and user menu.
 */

import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BreadcrumbResult } from '@/lib/breadcrumb';
import type { PatientResult } from '@/components/cemerog/PatientSearch';
import { UserMenu, type UserMenuProps } from './UserMenu';

export interface TopbarProps {
    breadcrumb: BreadcrumbResult | null;
    todayLabel: string;
    userMenuProps: UserMenuProps;
}

/** Format time as "9:14 a. m." using date-fns + es locale */
function formatClock(d: Date): string {
    return format(d, 'h:mm a', { locale: es });
}

/** Format short date as "25 oct." */
function formatShortDate(d: Date): string {
    return format(d, 'd MMM', { locale: es });
}

/** Minimal inline patient search for the topbar */
function TopbarSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PatientResult[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.length < 3) {
            setResults([]);
            setOpen(false);
            return;
        }
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/pacientes/buscar?q=${encodeURIComponent(query)}`,
                );
                if (!res.ok) {
                    setResults([]);
                    setOpen(true);
                    return;
                }
                const data: PatientResult[] = await res.json();
                setResults(Array.isArray(data) ? data : []);
                setOpen(true);
            } catch {
                setResults([]);
                setOpen(true);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (patient: PatientResult) => {
        setQuery('');
        setOpen(false);
        router.visit(`/pacientes?paciente=${patient.id}`);
    };

    return (
        <div ref={ref} className="relative">
            <input
                type="search"
                className="h-9 w-52 rounded-md border border-input-border bg-app-bg px-3 text-sm text-text-body transition-colors outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Buscar paciente o No. de atención…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
            />
            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-card-border bg-white shadow-lg">
                    {results.length === 0 ? (
                        <div className="px-3.5 py-3 text-sm text-muted">
                            No se encontraron pacientes.
                        </div>
                    ) : (
                        results.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelect(p)}
                                className="block w-full border-b border-row-separator px-3.5 py-2.5 text-left text-sm hover:bg-table-header-bg"
                            >
                                <div className="font-medium text-text-heading">
                                    {p.full_name}
                                </div>
                                <div className="text-xs text-muted">
                                    {p.document_number}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

/** Live clock showing time and short date, updated every minute */
function TopbarClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => {
            setNow(new Date());
        }, 60_000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="hidden items-center gap-1.5 text-sm text-muted lg:flex">
            <span data-testid="topbar-clock">{formatClock(now)}</span>
            <span aria-hidden="true">·</span>
            <span data-testid="topbar-date">{formatShortDate(now)}</span>
        </div>
    );
}

export function Topbar({ breadcrumb, todayLabel, userMenuProps }: TopbarProps) {
    return (
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-card-border bg-white px-4 shadow-sm">
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted">
                {breadcrumb ? (
                    <>
                        <span>{breadcrumb.section}</span>
                        <span aria-hidden="true">›</span>
                        {breadcrumb.subPage ? (
                            <>
                                <span>{breadcrumb.page}</span>
                                <span aria-hidden="true">›</span>
                                <span className="font-medium text-text-heading">
                                    {breadcrumb.subPage}
                                </span>
                            </>
                        ) : (
                            <span className="font-medium text-text-heading">
                                {breadcrumb.page}
                            </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{todayLabel}</span>
                    </>
                ) : (
                    <span className="font-medium text-text-heading">
                        CEMEROG
                    </span>
                )}
            </div>

            {/* Right: search, clock, notifications, user */}
            <div className="flex items-center gap-3">
                {/* Patient search */}
                <TopbarSearch />

                {/* Clock */}
                <TopbarClock />

                {/* Notifications (UI only) */}
                <button
                    className="relative rounded-md p-2 text-muted transition-colors hover:bg-accent-bg hover:text-primary"
                    aria-label="Notificaciones"
                >
                    <Bell className="h-4 w-4" />
                </button>

                {/* User menu */}
                <UserMenu {...userMenuProps} />
            </div>
        </header>
    );
}
