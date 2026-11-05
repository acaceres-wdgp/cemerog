/**
 * Topbar – application top bar with breadcrumb, patient search, clock, notifications, and user menu.
 * The patient search is only shown to users with module.pacientes.access.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BreadcrumbResult } from '@/lib/breadcrumb';
import type { PatientResult } from '@/components/cemerog/PatientSearch';
import PatientSearch from '@/components/cemerog/PatientSearch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import CashShiftIndicator from '@/components/caja/CashShiftIndicator';
import type { PageProps } from '@/types/global';
import { UserMenu, type UserMenuProps } from './UserMenu';

export interface TopbarProps {
    breadcrumb: BreadcrumbResult | null;
    userMenuProps: UserMenuProps;
}

/** Format time as "9:14 a. m." using date-fns + es locale */
function formatClock(d: Date): string {
    return format(d, 'h:mm a', { locale: es });
}

/** Format date as "mié 04/11/2026" */
function formatShortDate(d: Date): string {
    return format(d, 'EEE dd/MM/yyyy', { locale: es });
}

const SEARCH_LABEL = 'Buscar paciente por nombre, cédula o teléfono';

/**
 * Patient search in the topbar: a magnifier button that opens the shared
 * PatientSearch below it. Picking a patient opens their panel and closes the
 * search, so the topbar never keeps a selection.
 */
function TopbarSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const close = () => {
        setOpen(false);
        setQuery('');
    };

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) close();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleSelect = (patient: PatientResult) => {
        close();
        router.visit(`/pacientes?paciente=${patient.id}`);
    };

    return (
        <div
            ref={ref}
            className="relative"
            onKeyDown={(e) => e.key === 'Escape' && close()}
        >
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={() => (open ? close() : setOpen(true))}
                            aria-label={SEARCH_LABEL}
                            aria-expanded={open}
                            className="rounded-md p-2 text-muted transition-colors hover:bg-accent-bg hover:text-primary aria-expanded:bg-accent-bg aria-expanded:text-primary"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        {SEARCH_LABEL}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {open && (
                <div className="absolute top-full right-0 z-50 mt-2 w-80 rounded-[10px] border border-card-border bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,.1)]">
                    <PatientSearch
                        selected={null}
                        query={query}
                        onQueryChange={setQuery}
                        onSelect={handleSelect}
                        onClear={() => setQuery('')}
                        endpoint="/pacientes/buscar"
                        placeholder="Nombre, cédula o teléfono…"
                        ariaLabel={SEARCH_LABEL}
                    />
                </div>
            )}
        </div>
    );
}

/** Live clock with the date below it, updated every minute: the topbar's only date */
function TopbarClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => {
            setNow(new Date());
        }, 60_000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="hidden flex-col items-end text-right leading-tight whitespace-nowrap lg:flex">
            <span
                data-testid="topbar-clock"
                className="text-sm font-medium text-text-heading"
            >
                {formatClock(now)}
            </span>
            <span data-testid="topbar-date" className="text-xs text-muted">
                {formatShortDate(now)}
            </span>
        </div>
    );
}

export function Topbar({ breadcrumb, userMenuProps }: TopbarProps) {
    const { permissions } = usePage<PageProps>().props;
    const canSearchPatients = permissions.includes('module.pacientes.access');

    return (
        <header className="flex h-14 shrink-0 items-center gap-6 border-b border-card-border bg-white px-4 shadow-sm">
            {/* Left: breadcrumb – takes the free space and truncates before crowding the right side */}
            <div className="flex min-w-[180px] flex-1 items-center gap-2 overflow-hidden text-sm whitespace-nowrap text-muted">
                {breadcrumb ? (
                    <>
                        <span>{breadcrumb.section}</span>
                        <span aria-hidden="true">›</span>
                        {breadcrumb.subPage ? (
                            <>
                                {breadcrumb.pageHref ? (
                                    <Link
                                        href={breadcrumb.pageHref}
                                        className="hover:text-text-heading"
                                    >
                                        {breadcrumb.page}
                                    </Link>
                                ) : (
                                    <span>{breadcrumb.page}</span>
                                )}
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
                    </>
                ) : (
                    <span className="font-medium text-text-heading">
                        CEMEROG
                    </span>
                )}
            </div>

            {/* Right: search, cash register, clock, notifications, user */}
            <div className="flex min-w-0 items-center justify-end gap-3">
                {/* Patient search – only for users with pacientes access */}
                {canSearchPatients && <TopbarSearch />}

                {/* Cash register shift – only for users who bill or run the register */}
                <CashShiftIndicator />

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
