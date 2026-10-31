/**
 * Topbar – application top bar with breadcrumb, patient search, clock, notifications, and user menu.
 * The patient search is only shown to users with module.pacientes.access.
 */

import { useState } from 'react';
import { useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BreadcrumbResult } from '@/lib/breadcrumb';
import type { PatientResult } from '@/components/cemerog/PatientSearch';
import PatientSearch from '@/components/cemerog/PatientSearch';
import CashShiftIndicator from '@/components/caja/CashShiftIndicator';
import type { PageProps } from '@/types/global';
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

/** Patient search in the topbar, reusing the shared PatientSearch component. */
function TopbarSearch() {
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<PatientResult | null>(null);

    const handleSelect = (patient: PatientResult) => {
        setSelected(patient);
        router.visit(`/pacientes?paciente=${patient.id}`);
    };

    const handleClear = () => {
        setSelected(null);
        setQuery('');
    };

    // Clear selection whenever we navigate away (query changes externally)
    useEffect(() => {
        setSelected(null);
        setQuery('');
    }, []);

    return (
        <div className="w-52">
            <PatientSearch
                selected={selected}
                query={query}
                onQueryChange={setQuery}
                onSelect={handleSelect}
                onClear={handleClear}
                endpoint="/pacientes/buscar"
                compact
                placeholder="Buscar paciente o No. de atención…"
            />
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
    const { permissions } = usePage<PageProps>().props;
    const canSearchPatients = permissions.includes('module.pacientes.access');

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
